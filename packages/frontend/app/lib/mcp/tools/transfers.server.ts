import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { TransferViaRouter_Filter } from "~/gql/graphql";
import { OrderDirection } from "~/gql/graphql";
import {
  accountNotFoundMessage,
  resolveAccount,
} from "~/lib/mcp/core/accounts.server";
import {
  advanceCursor,
  type CursorItem,
  decodeCursor,
  encodeCursor,
  pageSizeFor,
  type TransferCursor,
} from "~/lib/mcp/core/cursor";
import { transferLine } from "~/lib/mcp/core/present";
import {
  enrichTransfers,
  fetchTransfers,
  type SubgraphTransfer,
} from "~/lib/mcp/core/transfers.server";
import { parseMessagePayload } from "~/lib/transfer-message";
import { errorResult, toolResult, USER_INPUT_NOTE } from "./result";

const MAX_LIMIT = 50;
/** 同一秒に並んだ取引をすべて拾うための保険。1 秒間にこれ以上の送金は想定していない */
const SIBLING_SCAN = 100;
/** usecase 絞り込みで走査する最大件数 */
const USECASE_SCAN_LIMIT = 500;
const USECASE_PAGE_SIZE = 100;

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_LIMIT)
  .default(20)
  .describe(`取得件数（1〜${MAX_LIMIT}）`);

const offsetSchema = z
  .number()
  .int()
  .min(0)
  .default(0)
  .describe("先頭から読み飛ばす件数");

async function respondWithTransfers(
  transfers: SubgraphTransfer[],
  extra: Record<string, unknown> = {},
  emptyMessage = "該当する取引はありません。",
) {
  const views = await enrichTransfers(transfers);
  const lines =
    views.length > 0
      ? views.map((view) => `- ${transferLine(view)}`)
      : [emptyMessage];

  return toolResult(lines, { transfers: views, count: views.length, ...extra });
}

/** 最新の取引の位置（timestamp とその秒の全 id）を初期カーソルにする */
async function currentCursor(): Promise<TransferCursor> {
  const latest = await fetchTransfers({
    first: 1,
    orderDirection: OrderDirection.Desc,
  });
  if (latest.length === 0) return { t: 0, ids: [] };

  const t = Number(latest[0].timestamp);
  const siblings = await fetchTransfers({
    where: { timestamp_gte: String(t) },
    first: SIBLING_SCAN,
    orderDirection: OrderDirection.Asc,
  });

  return { t, ids: siblings.map((row) => row.id) };
}

export function registerTransferTools(server: McpServer): void {
  server.registerTool(
    "poll_new_transfers",
    {
      title: "新着取引の取得",
      description: [
        "前回の続きから新しい取引だけを古い順で返す。定期実行して新着を監視する用途はこのツールを使う。",
        "cursor を省略すると items は空で next_cursor だけ返るので、購読開始時は 1 度呼んで next_cursor を保存する。",
        "以降は毎回 next_cursor を渡す。取りこぼしも重複も起きないように設計されている。",
        USER_INPUT_NOTE,
      ].join("\n"),
      inputSchema: z.object({
        cursor: z
          .string()
          .optional()
          .describe("前回の応答の next_cursor。初回は省略する"),
        limit: limitSchema,
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ cursor: rawCursor, limit }) => {
      if (!rawCursor) {
        const next = await currentCursor();
        return toolResult(
          [
            "購読を開始しました。next_cursor を保存して、次回以降 cursor に渡してください。",
          ],
          { transfers: [], count: 0, next_cursor: encodeCursor(next) },
        );
      }

      const cursor = decodeCursor(rawCursor);
      if (!cursor) {
        return errorResult(
          "cursor の形式が不正です。cursor を省略して呼び直し、返ってきた next_cursor を使ってください。",
        );
      }

      // 既読分が先頭に並ぶので、その分を上乗せして引かないと新着が limit 件揃わない
      const pageSize = pageSizeFor(limit, cursor.ids.length);
      const rows = await fetchTransfers({
        where: { timestamp_gte: String(cursor.t) },
        first: pageSize,
        orderDirection: OrderDirection.Asc,
      });

      const seen = new Set(cursor.ids);
      const consumed: CursorItem[] = [];
      const fresh: SubgraphTransfer[] = [];
      let truncated = false;

      for (const row of rows) {
        if (!seen.has(row.id) && fresh.length >= limit) {
          truncated = true;
          break;
        }
        consumed.push({ id: row.id, timestamp: Number(row.timestamp) });
        if (!seen.has(row.id)) fresh.push(row);
      }

      // ページを使い切った場合は続きが残っている可能性がある
      const hasMore = truncated || rows.length === pageSize;

      const next = advanceCursor(cursor, consumed);

      return respondWithTransfers(
        fresh,
        { next_cursor: encodeCursor(next), has_more: hasMore },
        "新しい取引はありません。",
      );
    },
  );

  server.registerTool(
    "list_recent_transfers",
    {
      title: "最新の取引一覧",
      description: [
        "新しい順に取引を返す。「最近どんな取引があった？」に答える用途。",
        "継続的な監視には poll_new_transfers を使うこと。",
        USER_INPUT_NOTE,
      ].join("\n"),
      inputSchema: z.object({
        limit: limitSchema,
        offset: offsetSchema,
        usecase: z
          .string()
          .optional()
          .describe(
            `使いみち（例: コミュニティ）での絞り込み。最大 ${USECASE_SCAN_LIMIT} 件まで遡って探す`,
          ),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ limit, offset, usecase }) => {
      if (!usecase) {
        const rows = await fetchTransfers({
          first: limit,
          skip: offset,
          orderDirection: OrderDirection.Desc,
        });
        return respondWithTransfers(rows, { offset });
      }

      // usecase はオンチェーンの message に JSON で埋まっており、サブグラフ側で絞れない。
      // 上限を決めて遡り、どこまで見たかを併せて返す。
      const target = usecase.trim();
      const matched: SubgraphTransfer[] = [];
      let scanned = 0;

      while (matched.length < limit && scanned < USECASE_SCAN_LIMIT) {
        const page = await fetchTransfers({
          first: USECASE_PAGE_SIZE,
          skip: offset + scanned,
          orderDirection: OrderDirection.Desc,
        });
        if (page.length === 0) break;
        scanned += page.length;

        for (const row of page) {
          if (matched.length >= limit) break;
          if (parseMessagePayload(row.message)?.usecase === target) {
            matched.push(row);
          }
        }
        if (page.length < USECASE_PAGE_SIZE) break;
      }

      return respondWithTransfers(
        matched,
        { offset, usecase: target, scanned },
        `使いみち「${target}」の取引は直近 ${scanned} 件の中にはありません。`,
      );
    },
  );

  server.registerTool(
    "get_transfer",
    {
      title: "取引の詳細",
      description: [
        "トランザクションハッシュ、または取引 ID で 1 件の取引を引く。",
        "1 つの tx に複数の送金が含まれることがあるため配列で返る。",
        USER_INPUT_NOTE,
      ].join("\n"),
      inputSchema: z.object({
        tx_hash: z
          .string()
          .optional()
          .describe("0x… のトランザクションハッシュ"),
        id: z
          .string()
          .optional()
          .describe("サブグラフの取引 ID（<txHash>-<logIndex>）"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ tx_hash, id }) => {
      if (!tx_hash && !id) {
        return errorResult("tx_hash か id のどちらかを指定してください。");
      }

      const where: TransferViaRouter_Filter = id
        ? { id }
        : { transactionHash: tx_hash?.toLowerCase() };

      const rows = await fetchTransfers({
        where,
        first: 20,
        orderDirection: OrderDirection.Asc,
      });

      return respondWithTransfers(
        rows,
        {},
        "指定された取引は見つかりませんでした。インデックスがまだ追いついていない可能性もあります（get_index_status で確認できます）。",
      );
    },
  );

  server.registerTool(
    "list_account_transfers",
    {
      title: "アカウント別の取引履歴",
      description: [
        "特定ユーザーの送受信履歴を新しい順で返す。",
        "account はウォレットアドレス / ENS 名 / ユーザー名のいずれでもよい。",
        USER_INPUT_NOTE,
      ].join("\n"),
      inputSchema: z.object({
        account: z
          .string()
          .describe("0x… のアドレス、alice.toban.eth、または alice"),
        direction: z
          .enum(["sent", "received", "both"])
          .default("both")
          .describe("送信のみ / 受信のみ / 両方"),
        limit: limitSchema,
        offset: offsetSchema,
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ account, direction, limit, offset }) => {
      const profile = await resolveAccount(account);
      if (!profile) return errorResult(accountNotFoundMessage(account));

      const address = profile.address;
      const where: TransferViaRouter_Filter =
        direction === "sent"
          ? { from: address }
          : direction === "received"
            ? { to: address }
            : { or: [{ from: address }, { to: address }] };

      const rows = await fetchTransfers({
        where,
        first: limit,
        skip: offset,
        orderDirection: OrderDirection.Desc,
      });

      return respondWithTransfers(
        rows,
        { account: profile, direction, offset },
        `${profile.display_name} の取引は見つかりませんでした。`,
      );
    },
  );
}
