/**
 * 新着取引ポーリング用のカーソル。
 *
 * サブグラフは orderBy に 1 フィールドしか取れず、同一ブロック内の送金は
 * timestamp が同値になる。単純な `timestamp_gt` では同じ秒の兄弟を取りこぼし、
 * `timestamp_gte` では毎回同じ件が重複する。
 * そこで「どこまで読んだか」を (最後に読んだ timestamp, その秒で既読の id) で表す。
 */
export interface TransferCursor {
  /** 最後に読んだ取引の timestamp（秒） */
  t: number;
  /** timestamp === t のうち既読の id */
  ids: string[];
}

/**
 * 同一秒に大量の取引が入った場合でもカーソル文字列が無制限に伸びないよう上限を設ける。
 * これを超えるのは 1 秒間に 500 件送金された場合だけで、その時は重複の可能性を許容する。
 */
const MAX_SEEN_IDS = 500;

export function encodeCursor(cursor: TransferCursor): string {
  const json = JSON.stringify({
    t: cursor.t,
    ids: cursor.ids.slice(-MAX_SEEN_IDS),
  });
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeCursor(raw: string): TransferCursor | null {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    );
    if (!parsed || typeof parsed !== "object") return null;

    const { t, ids } = parsed as { t?: unknown; ids?: unknown };
    if (typeof t !== "number" || !Number.isFinite(t) || t < 0) return null;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      return null;
    }

    return { t, ids: ids as string[] };
  } catch {
    return null;
  }
}

export interface CursorItem {
  id: string;
  timestamp: number;
}

/**
 * 取得したページから次のカーソルを組み立てる。
 *
 * consumed は「今回のレスポンスに載せた分」だけでなく
 * 「既読として読み飛ばした分」も含めた、ストリームの先頭からの連続した並びであること。
 */
export function advanceCursor(
  previous: TransferCursor,
  consumed: CursorItem[],
): TransferCursor {
  const last = consumed.at(-1);
  if (!last) return previous;

  const idsAtLast = consumed
    .filter((item) => item.timestamp === last.timestamp)
    .map((item) => item.id);

  // 同じ秒のまま読み進めた場合は、前回までの既読 id も引き継がないと取りこぼす
  const carried = previous.t === last.timestamp ? previous.ids : [];
  const ids = [...new Set([...carried, ...idsAtLast])];

  return { t: last.timestamp, ids: ids.slice(-MAX_SEEN_IDS) };
}

/**
 * `timestamp_gte` で引くときの取得件数。
 * 先頭には既読分がそのまま並ぶので、その分を上乗せしないと新着が limit 件揃わない。
 * graph-node の first の上限は 1000。
 */
export function pageSizeFor(limit: number, seenIds: number): number {
  return Math.min(limit + seenIds + 1, 1000);
}
