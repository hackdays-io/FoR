import { describe, expect, it } from "vitest";
import { computeForStatus } from "./for-status";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000; // 固定の現在時刻（ms）

const daysAgo = (n: number) => NOW - n * DAY;

/** 「直近 N 日間、毎日 1 回決済」のタイムスタンプ列を作る（N+1 件） */
function dailyPayments(days: number): number[] {
  const out: number[] = [];
  for (let d = days; d >= 0; d--) out.push(daysAgo(d));
  return out;
}

/** daysAgo(from) 〜 daysAgo(to) を毎日 1 回決済 */
function dailyRange(from: number, to: number): number[] {
  const out: number[] = [];
  for (let d = from; d >= to; d--) out.push(daysAgo(d));
  return out;
}

const status = (paymentTimestampsMs: number[]) =>
  computeForStatus({ paymentTimestampsMs, nowMs: NOW });

describe("computeForStatus - 昇格トリガー", () => {
  it("決済なしは Tier 1 (Honeybee)、減衰・アラートなし", () => {
    const s = status([]);
    expect(s.tier).toBe(1);
    expect(s.nameEn).toBe("Honeybee");
    expect(s.lastActivityMs).toBeNull();
    expect(s.nextDecayAtMs).toBeNull();
    expect(s.daysUntilDecay).toBeNull();
    expect(s.alertMessage).toBeNull();
  });

  it("Tier 1 → 2: 累計 3 回で Squirrel（2 回では据え置き）", () => {
    expect(status([daysAgo(2), daysAgo(1)]).tier).toBe(1);
    const s = status([daysAgo(3), daysAgo(2), daysAgo(1)]);
    expect(s.tier).toBe(2);
    expect(s.nameEn).toBe("Squirrel");
  });

  it("Tier 2 → 3: 累計 9 回で Bird（8 回では据え置き）", () => {
    expect(status(dailyPayments(7)).tier).toBe(2); // 8 件
    const s = status(dailyPayments(8)); // 9 件
    expect(s.tier).toBe(3);
    expect(s.nameEn).toBe("Bird");
  });

  it("一度に 1 段階のみ昇格: 同日に 9 件でも Tier 3 まで", () => {
    const s = status(Array.from({ length: 9 }, () => daysAgo(1)));
    // p3: ->2, p9: 累計 9 で ->3。月 12 回には届かない
    expect(s.tier).toBe(3);
  });

  it("Tier 3 → 4: 直近 30 日で 12 回で Deer（11 回では据え置き）", () => {
    expect(status(dailyRange(28, 18)).tier).toBe(3); // 11 件
    const s = status(dailyRange(29, 18)); // 12 件、最終決済から 18 日
    expect(s.tier).toBe(4);
    expect(s.nameEn).toBe("Deer");
  });

  it("Tier 3 → 4: 12 回でも 30 日に収まらなければ据え置き", () => {
    // 3 日おきに 12 回 = 33 日にまたがる。どの時点でも直近 30 日は 11 回
    const payments = Array.from({ length: 12 }, (_, i) => daysAgo(33 - i * 3));
    expect(status(payments).tier).toBe(3);
  });

  it("Tier 4 → 5: 週 3 回ペースを 2 週間継続で Owl（13 日では据え置き）", () => {
    // 毎日決済すると 3 件目からペース成立。16 日前開始なら 14 日前から 2 週間継続
    expect(status(dailyPayments(15)).tier).toBe(4);
    const s = status(dailyPayments(16));
    expect(s.tier).toBe(5);
    expect(s.nameEn).toBe("Owl");
  });

  it("Tier 4 → 5: ペースが途切れると継続期間はリセットされる", () => {
    // 30〜20 日前に毎日、13 日空けて 6〜0 日前に毎日。累計 18 件・月 12 件で Tier 4 だが
    // 直近のペースは 4 日前からしか続いていない
    const s = status([...dailyRange(30, 20), ...dailyRange(6, 0)]);
    expect(s.tier).toBe(4);
  });

  it("Tier 5 → 6: 週 3 回ペースを 3 ヶ月継続で Wolf（89 日では据え置き）", () => {
    expect(status(dailyPayments(91)).tier).toBe(5);
    const s = status(dailyPayments(92));
    expect(s.tier).toBe(6);
    expect(s.nameEn).toBe("Wolf");
  });

  it("毎日 35 日決済しても Tier 5 止まり（旧条件では Tier 6 だった）", () => {
    expect(status(dailyPayments(35)).tier).toBe(5);
  });
});

describe("computeForStatus - 維持と減衰", () => {
  it("Tier 2: 最終決済から 60 日以内は維持", () => {
    const s = status([daysAgo(61), daysAgo(60), daysAgo(59)]);
    expect(s.tier).toBe(2);
    expect(s.daysUntilDecay).toBe(1);
  });

  it("Tier 2: 最終決済から 60 日経過で Tier 1 へランクダウン", () => {
    const s = status([daysAgo(63), daysAgo(62), daysAgo(61)]);
    expect(s.tier).toBe(1);
    expect(s.alertMessage).toBeNull();
  });

  it("減衰は 1 段階ずつ: Tier 3 到達後に放置すると 45 日経過で Tier 2 まで", () => {
    // 累計 9 回で Tier 3 到達。最後の決済から 46 日（>45）経過 → Tier 2 へ 1 段ダウン。
    // Tier 2 の維持は 60 日なので 46 日時点では Tier 2 を維持。
    const s = status(dailyRange(54, 46));
    expect(s.tier).toBe(2);
  });

  it("減衰の連鎖: Tier 3 から十分放置すると Tier 1 まで落ちる", () => {
    // 累計 9 で Tier 3 到達後 100 日放置: 45 日で→2, さらに 60 日(最終決済から)で→1
    const s = status(dailyRange(108, 100));
    expect(s.tier).toBe(1);
  });
});

describe("computeForStatus - 進捗（次ランクへの到達度）", () => {
  it("決済なしの Tier 1 は進捗 1（最小）", () => {
    const s = status([]);
    expect(s.tier).toBe(1);
    expect(s.progress).toBe(1);
  });

  it("Tier 1: 累計 1 回は 1/3 → step2、累計 2 回は 2/3 → step4", () => {
    const one = status([daysAgo(1)]);
    expect(one.tier).toBe(1);
    expect(one.progress).toBe(2);

    const two = status([daysAgo(2), daysAgo(1)]);
    expect(two.tier).toBe(1);
    expect(two.progress).toBe(4);
  });

  it("Tier 2: 累計 3 回は 3/9 → step2、累計 6 回は 6/9 → step4", () => {
    const three = status(dailyPayments(2));
    expect(three.tier).toBe(2);
    expect(three.progress).toBe(2);

    const six = status(dailyPayments(5));
    expect(six.tier).toBe(2);
    expect(six.progress).toBe(4);
  });

  it("Tier 3: 直近 30 日 9 回は 9/12 → step5", () => {
    const s = status(dailyPayments(8));
    expect(s.tier).toBe(3);
    expect(s.progress).toBe(5);
  });

  it("Tier 4: ペース継続 9 日は 9/14 → step4", () => {
    // 12 件毎日: 3 件目（9 日前）からペース成立、現在まで 9 日継続
    const s = status(dailyPayments(11));
    expect(s.tier).toBe(4);
    expect(s.progress).toBe(4);
  });

  it("Tier 5: ペース継続 33 日は 33/90 → step2", () => {
    const s = status(dailyPayments(35));
    expect(s.tier).toBe(5);
    expect(s.progress).toBe(2);
  });

  it("Tier 6 は最上位なので常に進捗 6（フル）", () => {
    const s = status(dailyPayments(92));
    expect(s.tier).toBe(6);
    expect(s.progress).toBe(6);
  });
});

describe("computeForStatus - 昇格案内（upgradeMessage）", () => {
  it("Tier 1: 累計 0 回は あと3回、累計 2 回は あと1回でUP", () => {
    expect(status([]).upgradeMessage).toBe("あと3回の交換でステータスUP！");
    expect(status([daysAgo(2), daysAgo(1)]).upgradeMessage).toBe(
      "あと1回の交換でステータスUP！",
    );
  });

  it("Tier 2: 累計 3 回は あと6回（累計 9 で昇格）", () => {
    const s = status(dailyPayments(2));
    expect(s.tier).toBe(2);
    expect(s.upgradeMessage).toBe("あと6回の交換でステータスUP！");
  });

  it("Tier 3: 月内回数に応じて『今月あとN回』", () => {
    const s = status(dailyPayments(8));
    expect(s.tier).toBe(3);
    // 直近 1 ヶ月に 9 件 → 12-9 = 今月あと 3 回
    expect(s.upgradeMessage).toBe("今月あと3回の交換でステータスUP！");
  });

  it("Tier 4: 週 3 回を 2 週間続ける案内", () => {
    const s = status(dailyPayments(11));
    expect(s.tier).toBe(4);
    expect(s.upgradeMessage).toBe("週3回の交換を2週間続けてステータスUP！");
  });

  it("Tier 5: 週 3 回を 3 ヶ月続ける案内", () => {
    const s = status(dailyPayments(35));
    expect(s.tier).toBe(5);
    expect(s.upgradeMessage).toBe("週3回の交換を3ヶ月続けてステータスUP！");
  });

  it("Tier 6: 最高ランクは upgradeMessage なし", () => {
    const s = status(dailyPayments(92));
    expect(s.tier).toBe(6);
    expect(s.upgradeMessage).toBeNull();
  });
});

describe("computeForStatus - アラート文言と残日数", () => {
  it("残日数を文言に埋め込む（Tier 2、残り 10 日）", () => {
    const s = status([daysAgo(52), daysAgo(51), daysAgo(50)]);
    expect(s.tier).toBe(2);
    expect(s.daysUntilDecay).toBe(10);
    expect(s.alertMessage).toContain("あと10日以内");
    expect(s.alertMessage).toContain("リスの活気");
  });

  it("nextDecayAtMs は最終決済 + 維持日数", () => {
    const last = daysAgo(10);
    const s = status([daysAgo(12), daysAgo(11), last]);
    expect(s.tier).toBe(2);
    expect(s.nextDecayAtMs).toBe(last + 60 * DAY);
  });
});

describe("computeForStatus - 過去最高ティア（peakTier）", () => {
  it("決済なしは peakTier 1", () => {
    const s = computeForStatus({ paymentTimestampsMs: [], nowMs: NOW });
    expect(s.peakTier).toBe(1);
  });

  it("ランクダウンしていなければ peakTier は現在ティアと同じ", () => {
    const s = computeForStatus({
      paymentTimestampsMs: dailyPayments(35),
      nowMs: NOW,
    });
    expect(s.tier).toBe(6);
    expect(s.peakTier).toBe(6);
  });

  it("Tier 6 到達後にランクダウンしても peakTier は 6 のまま", () => {
    // 毎日 36 回の決済で Tier 6 到達、最終決済から 20 日放置。
    // Tier 6 の維持 14 日を過ぎて Tier 5 へ（Tier 5 の維持 21 日はまだ残る）。
    const s = computeForStatus({
      paymentTimestampsMs: dailyPayments(35).map((t) => t - 20 * DAY),
      nowMs: NOW,
    });
    expect(s.tier).toBe(5);
    expect(s.peakTier).toBe(6);
  });

  it("減衰の連鎖で Tier 1 まで落ちても peakTier は到達時のまま", () => {
    const s = computeForStatus({
      paymentTimestampsMs: [daysAgo(102), daysAgo(101), daysAgo(100)],
      nowMs: NOW,
    });
    expect(s.tier).toBe(1);
    expect(s.peakTier).toBe(3);
  });
});
