import { describe, expect, it } from "vitest";
import { computeForStatus } from "./for-status";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000; // 固定の現在時刻（ms）

const daysAgo = (n: number) => NOW - n * DAY;

/** 「直近 N 日間、毎日 1 回決済」のタイムスタンプ列を作る */
function dailyPayments(days: number): number[] {
  const out: number[] = [];
  for (let d = days; d >= 0; d--) out.push(daysAgo(d));
  return out;
}

describe("computeForStatus - 昇格トリガー", () => {
  it("決済なしは Tier 1 (Honeybee)、減衰・アラートなし", () => {
    const s = computeForStatus({ paymentTimestampsMs: [], nowMs: NOW });
    expect(s.tier).toBe(1);
    expect(s.nameEn).toBe("Honeybee");
    expect(s.lastActivityMs).toBeNull();
    expect(s.nextDecayAtMs).toBeNull();
    expect(s.daysUntilDecay).toBeNull();
    expect(s.alertMessage).toBeNull();
  });

  it("初回決済で Tier 2 (Squirrel) へ", () => {
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(1)],
      nowMs: NOW,
    });
    expect(s.tier).toBe(2);
    expect(s.nameEn).toBe("Squirrel");
  });

  it("一度に 1 段階のみ昇格: 同日に 3 件でも Tier 3 まで", () => {
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(1), daysAgo(1), daysAgo(1)],
      nowMs: NOW,
    });
    // p1: ->2, p2: 据え置き, p3: 累計3 で ->3
    expect(s.tier).toBe(3);
    expect(s.nameEn).toBe("Bird");
  });

  it("週 3 回以上で Tier 5 まで climb する（4 件・直近 7 日）", () => {
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(3), daysAgo(2), daysAgo(1), daysAgo(0)],
      nowMs: NOW,
    });
    // 1段ずつ: p1->2, p2->2, p3(累計3/週3)->3, p4->4。週3トリガーは満たすが1段制約で4止まり
    expect(s.tier).toBe(4);
  });

  it("毎日 35 日決済すると Tier 6 (Wolf) に到達", () => {
    const s = computeForStatus({
      paymentTimestampsMs: dailyPayments(35),
      nowMs: NOW,
    });
    expect(s.tier).toBe(6);
    expect(s.nameEn).toBe("Wolf");
  });
});

describe("computeForStatus - 維持と減衰", () => {
  it("Tier 2: 最終決済から 60 日以内は維持", () => {
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(59)],
      nowMs: NOW,
    });
    expect(s.tier).toBe(2);
    expect(s.daysUntilDecay).toBe(1);
  });

  it("Tier 2: 最終決済から 60 日経過で Tier 1 へランクダウン", () => {
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(61)],
      nowMs: NOW,
    });
    expect(s.tier).toBe(1);
    expect(s.alertMessage).toBeNull();
  });

  it("減衰は 1 段階ずつ: Tier 3 到達後に放置すると 45 日経過で Tier 2 まで", () => {
    // 累計3回で Tier3 到達。最後の決済から 46 日（>45）経過 → Tier2 へ1段ダウン。
    // Tier2 の維持は 60 日なので 46 日時点では Tier2 を維持。
    const last = daysAgo(46);
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(48), daysAgo(47), last],
      nowMs: NOW,
    });
    expect(s.tier).toBe(2);
  });

  it("減衰の連鎖: Tier 3 から十分放置すると Tier 1 まで落ちる", () => {
    // 累計3で Tier3 到達後 100 日放置: 45日で→2, さらに 60日(最終決済から)で→1
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(102), daysAgo(101), daysAgo(100)],
      nowMs: NOW,
    });
    expect(s.tier).toBe(1);
  });
});

describe("computeForStatus - アラート文言と残日数", () => {
  it("残日数を文言に埋め込む（Tier 2、残り 10 日）", () => {
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(50)],
      nowMs: NOW,
    });
    expect(s.tier).toBe(2);
    expect(s.daysUntilDecay).toBe(10);
    expect(s.alertMessage).toContain("あと10日以内");
    expect(s.alertMessage).toContain("リスの活気");
  });

  it("nextDecayAtMs は最終決済 + 維持日数", () => {
    const last = daysAgo(10);
    const s = computeForStatus({ paymentTimestampsMs: [last], nowMs: NOW });
    expect(s.nextDecayAtMs).toBe(last + 60 * DAY);
  });
});
