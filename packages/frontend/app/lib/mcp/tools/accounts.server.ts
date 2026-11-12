import type { McpServer } from "@modelcontextprotocol/server";
import { isAddress } from "viem";
import { z } from "zod";
import { OrderDirection } from "~/gql/graphql";
import { MCP_GET_ACCOUNT } from "~/graphql/mcp-queries";
import {
  accountNotFoundMessage,
  resolveAccount,
} from "~/lib/mcp/core/accounts.server";
import {
  anonymousProfile,
  type ProfileView,
  toDecimal,
  transferLine,
} from "~/lib/mcp/core/present";
import { resolveProfiles, toProfileView } from "~/lib/mcp/core/profiles.server";
import { querySubgraph } from "~/lib/mcp/core/subgraph.server";
import {
  enrichTransfers,
  fetchTransfers,
} from "~/lib/mcp/core/transfers.server";
import { searchNames } from "~/lib/namespace.server";
import { errorResult, toolResult, USER_INPUT_NOTE } from "./result";

const RECENT_TRANSFERS = 5;
const MAX_ADDRESSES = 50;
const MAX_SEARCH_RESULTS = 20;

function profileLine(profile: ProfileView): string {
  const name = profile.name ? `${profile.name} / ` : "";
  const description = profile.description ? ` — ${profile.description}` : "";
  return `- ${profile.display_name}（${name}${profile.address}）${description}`;
}

export function registerAccountTools(server: McpServer): void {
  server.registerTool(
    "get_account",
    {
      title: "アカウントの概要",
      description: [
        "1 人のユーザーのプロフィール、これまでに納めた基金・burn の累計、直近の取引を返す。",
        "account はウォレットアドレス / ENS 名 / ユーザー名のいずれでもよい。",
        USER_INPUT_NOTE,
      ].join("\n"),
      inputSchema: z.object({
        account: z
          .string()
          .describe("0x… のアドレス、alice.toban.eth、または alice"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ account }) => {
      const profile = await resolveAccount(account);
      if (!profile) return errorResult(accountNotFoundMessage(account));

      const [stats, recentRows] = await Promise.all([
        querySubgraph(MCP_GET_ACCOUNT, { id: profile.address }),
        fetchTransfers({
          where: {
            or: [{ from: profile.address }, { to: profile.address }],
          },
          first: RECENT_TRANSFERS,
          orderDirection: OrderDirection.Desc,
        }),
      ]);

      const recent = await enrichTransfers(recentRows);
      const contributions = stats.user
        ? {
            total_tax_paid: toDecimal(stats.user.totalTaxPaid),
            fund_tax_paid: toDecimal(stats.user.totalFundTaxPaid),
            burn_tax_paid: toDecimal(stats.user.totalBurnTaxPaid),
          }
        : { total_tax_paid: "0", fund_tax_paid: "0", burn_tax_paid: "0" };

      const lines = [
        profileLine(profile),
        `基金へ ${contributions.fund_tax_paid} FoR / burn ${contributions.burn_tax_paid} FoR（累計 ${contributions.total_tax_paid} FoR）`,
        recent.length > 0 ? "直近の取引:" : "取引履歴はまだありません。",
        ...recent.map((view) => `- ${transferLine(view)}`),
      ];

      return toolResult(lines, {
        account: profile,
        contributions,
        recent_transfers: recent,
      });
    },
  );

  server.registerTool(
    "resolve_profiles",
    {
      title: "アドレスをプロフィールに変換",
      description: [
        "ウォレットアドレスの配列を ENS サブネームのプロフィールに一括変換する。",
        "取引データをユーザーに見せる前に、アドレスを表示名へ置き換える用途。",
        "未登録のアドレスは is_registered: false で短縮アドレスが display_name になる。",
      ].join("\n"),
      inputSchema: z.object({
        addresses: z
          .array(z.string())
          .min(1)
          .max(MAX_ADDRESSES)
          .describe(`0x… のアドレス配列（最大 ${MAX_ADDRESSES} 件）`),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ addresses }) => {
      const invalid = addresses.filter((address) => !isAddress(address));
      if (invalid.length > 0) {
        return errorResult(
          `アドレスの形式が不正です: ${invalid.slice(0, 5).join(", ")}`,
        );
      }

      const views = await resolveProfiles(addresses);
      const profiles = addresses.map(
        (address) =>
          views.get(address.toLowerCase()) ?? anonymousProfile(address),
      );

      return toolResult(profiles.map(profileLine), {
        profiles,
        registered_count: profiles.filter((p) => p.is_registered).length,
      });
    },
  );

  server.registerTool(
    "search_accounts",
    {
      title: "ユーザー検索",
      description:
        "ユーザー名（ENS サブネームのラベル）の部分一致でユーザーを探す。名前からアドレスを知りたいときに使う。",
      inputSchema: z.object({
        query: z.string().min(1).describe("ユーザー名の一部（例: ali）"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ query }) => {
      const results = await searchNames(query);
      const profiles = results
        .filter((profile) => profile.address)
        .slice(0, MAX_SEARCH_RESULTS)
        .map(toProfileView);

      if (profiles.length === 0) {
        return toolResult([`「${query}」に一致するユーザーはいません。`], {
          profiles: [],
          count: 0,
        });
      }

      return toolResult(profiles.map(profileLine), {
        profiles,
        count: profiles.length,
      });
    },
  );
}
