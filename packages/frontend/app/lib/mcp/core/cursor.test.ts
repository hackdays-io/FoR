import { describe, expect, it } from "vitest";
import {
  advanceCursor,
  type CursorItem,
  decodeCursor,
  encodeCursor,
  pageSizeFor,
  type TransferCursor,
} from "./cursor";

const item = (id: string, timestamp: number): CursorItem => ({ id, timestamp });

/**
 * サブグラフを模したストリーム。timestamp 昇順に並んだ全取引から
 * `timestamp_gte` + `first` で 1 ページ切り出す。
 */
function fetchPage(
  all: CursorItem[],
  cursor: TransferCursor,
  first: number,
): CursorItem[] {
  return all.filter((row) => row.timestamp >= cursor.t).slice(0, first);
}

/** poll_new_transfers と同じ手順で 1 回分のポーリングを行う */
function poll(all: CursorItem[], cursor: TransferCursor, limit: number) {
  const rows = fetchPage(all, cursor, pageSizeFor(limit, cursor.ids.length));
  const seen = new Set(cursor.ids);
  const consumed: CursorItem[] = [];
  const fresh: CursorItem[] = [];

  for (const row of rows) {
    if (!seen.has(row.id) && fresh.length >= limit) break;
    consumed.push(row);
    if (!seen.has(row.id)) fresh.push(row);
  }

  return { fresh, next: advanceCursor(cursor, consumed) };
}

describe("encodeCursor / decodeCursor", () => {
  it("往復しても内容が変わらない", () => {
    const cursor: TransferCursor = {
      t: 1788656819,
      ids: ["0xabc-1", "0xdef-2"],
    };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("壊れた文字列は null になる", () => {
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(decodeCursor(Buffer.from("[]").toString("base64url"))).toBeNull();
    expect(
      decodeCursor(Buffer.from('{"t":"x","ids":[]}').toString("base64url")),
    ).toBeNull();
  });
});

describe("advanceCursor", () => {
  it("同じ秒を読み進めた場合は既読 id を引き継ぐ", () => {
    const previous: TransferCursor = { t: 100, ids: ["a"] };
    const next = advanceCursor(previous, [item("a", 100), item("b", 100)]);
    expect(next).toEqual({ t: 100, ids: ["a", "b"] });
  });

  it("秒が進んだら古い id は捨てる", () => {
    const previous: TransferCursor = { t: 100, ids: ["a", "b"] };
    const next = advanceCursor(previous, [
      item("a", 100),
      item("b", 100),
      item("c", 101),
    ]);
    expect(next).toEqual({ t: 101, ids: ["c"] });
  });

  it("何も読めなかったらカーソルは動かない", () => {
    const previous: TransferCursor = { t: 100, ids: ["a"] };
    expect(advanceCursor(previous, [])).toEqual(previous);
  });
});

describe("ポーリング全体", () => {
  it("同一秒に複数件あっても重複も取りこぼしも出ない", () => {
    // 100 秒に 3 件、101 秒に 1 件（= 同一ブロック内の複数送金）
    const all = [
      item("a", 100),
      item("b", 100),
      item("c", 100),
      item("d", 101),
    ];

    // 購読開始時点では 100 秒の a, b まで読み終わっているとする
    let cursor: TransferCursor = { t: 100, ids: ["a", "b"] };

    const first = poll(all, cursor, 10);
    expect(first.fresh.map((row) => row.id)).toEqual(["c", "d"]);
    cursor = first.next;

    // 続けて呼んでも同じものは返らない
    const second = poll(all, cursor, 10);
    expect(second.fresh).toEqual([]);
    expect(second.next).toEqual(cursor);
  });

  it("limit で分割しても連続して取り切れる", () => {
    const all = Array.from({ length: 7 }, (_, i) =>
      // わざと 3 件ずつ同じ秒に固める
      item(`t${i}`, 100 + Math.floor(i / 3)),
    );

    let cursor: TransferCursor = { t: 0, ids: [] };
    const collected: string[] = [];

    for (let round = 0; round < 5; round++) {
      const result = poll(all, cursor, 2);
      collected.push(...result.fresh.map((row) => row.id));
      cursor = result.next;
    }

    expect(collected).toEqual(all.map((row) => row.id));
    expect(new Set(collected).size).toBe(all.length);
  });
});

describe("pageSizeFor", () => {
  it("既読件数を上乗せする", () => {
    expect(pageSizeFor(20, 0)).toBe(21);
    expect(pageSizeFor(20, 5)).toBe(26);
  });

  it("graph-node の上限 1000 を超えない", () => {
    expect(pageSizeFor(50, 5000)).toBe(1000);
  });
});
