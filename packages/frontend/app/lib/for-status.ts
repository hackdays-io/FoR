// FoR Status（ランクシステム）のロジック。
//
// このモジュールは「決済（= ユーザーが送信者となる送金）履歴」と「現在時刻」だけから
// 現在のティアを都度再構成する純粋関数群。ランク状態は永続保存しない前提のため、
// すべての判定を決済履歴から導出できるように設計している。
//
// ルール（確定事項）:
// - 決済 = 送信のみ。受信はカウントしない（カウント対象の抽出は呼び出し側の責務）。
// - 昇格: トリガーを満たせば到達するが、一度に上がるのは 1 段階のみ。
// - 減衰: 維持条件を満たさなくなったら 1 段階ずつランクダウン（最終決済からの経過で判定）。
// - 上位ティア（5・6）は「週 3 回以上の決済ペース」を一定期間継続したかで判定する。

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;

export const TIERS: readonly Tier[] = [1, 2, 3, 4, 5, 6];

// バッジ外周リングの進捗段階（1 = 入りたて・最小、6 = 次ランク目前・フル）。
export type ProgressStep = 1 | 2 | 3 | 4 | 5 | 6;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

// 昇格トリガー（#178 で約 3 倍に難化）。
// 下位は回数を 3 倍、上位は「週 3 回ペース」の継続期間を伸ばす方針。
// 回数を単純に 3 倍（週 9 回など）すると現実的に達成不能になるため。
/** Tier 1 → 2: 累計決済回数 */
const TIER2_TOTAL_COUNT = 3;
/** Tier 2 → 3: 累計決済回数 */
const TIER3_TOTAL_COUNT = 9;
/** Tier 3 → 4: 直近 1 ヶ月の決済回数 */
const TIER4_MONTHLY_COUNT = 12;
/** 上位ティアの「ペース」: 直近 7 日でこの回数以上 */
const WEEKLY_PACE_COUNT = 3;
/** Tier 4 → 5: 週 3 回ペースをこの期間継続 */
const TIER5_PACE_SPAN_MS = 2 * WEEK_MS;
/** Tier 5 → 6: 週 3 回ペースをこの期間継続 */
const TIER6_PACE_SPAN_MS = 3 * MONTH_MS;

export type TierInfo = {
  tier: Tier;
  nameJa: string;
  nameEn: string;
};

const TIER_INFO: Record<Tier, TierInfo> = {
  1: { tier: 1, nameJa: "ミツバチ", nameEn: "Honeybee" },
  2: { tier: 2, nameJa: "リス", nameEn: "Squirrel" },
  3: { tier: 3, nameJa: "鳥", nameEn: "Bird" },
  4: { tier: 4, nameJa: "鹿", nameEn: "Deer" },
  5: { tier: 5, nameJa: "フクロウ", nameEn: "Owl" },
  6: { tier: 6, nameJa: "オオカミ", nameEn: "Wolf" },
};

// 維持日数: 「最終決済からこの日数が経過すると 1 段階ランクダウン」。
// Tier 1 は永続のため減衰なし（null）。
// #178 の昇格難化では据え置き。昇格の希少性は昇格トリガー側で担保し、
// 減衰まで同時に厳しくすると到達したランクをすぐ失う二重の負担になるため。
const MAINTENANCE_DAYS: Record<Tier, number | null> = {
  1: null,
  2: 60,
  3: 45,
  4: 30,
  5: 21,
  6: 14,
};

// 減衰アラートメッセージのテンプレート。`{days}` に「次のランクダウンまでの残日数」を埋め込む。
// 文言は確定済み。Tier 1 は永続のためアラートなし（null）。
const ALERT_TEMPLATES: Record<Tier, string | null> = {
  1: null,
  2: "埋めた種を忘れていませんか？あと{days}日以内にFoRをつかって、リスの活気を取り戻しましょう。",
  3: "翼を休めすぎているようです。森の空気が淀む前に、あと{days}日以内に新しいケアを。",
  4: "森が少し乾燥してきました。鹿の歩みを止めないよう、あと{days}日以内に潤いを届けましょう。",
  5: "賢者の眼が閉じかけています。森の秩序を保つため、あと{days}日以内にFoRをつかってみましょう。",
  6: "伝説が霧に消えようとしています。リーダーの帰還を森が待っています。あと{days}日以内にケアを。",
};

export function getTierInfo(tier: Tier): TierInfo {
  return TIER_INFO[tier];
}

export type ForStatus = {
  /** 現在のティア */
  tier: Tier;
  /**
   * 過去に到達した最高ティア（ランクダウン後も下がらない）。
   * シークレット扱いの Tier 6 を一度到達したユーザーには公開し続けるために使う。
   */
  peakTier: Tier;
  nameJa: string;
  nameEn: string;
  /** 現在ティア内の進捗（1〜6）。次ランクへの到達度をバッジの 6 段階で表す */
  progress: ProgressStep;
  /** 最終決済時刻（ms）。決済が一度もなければ null */
  lastActivityMs: number | null;
  /** 次のランクダウン時刻（ms）。Tier 1（減衰なし）または決済なしの場合は null */
  nextDecayAtMs: number | null;
  /** 次のランクダウンまでの残日数（切り上げ・0 以上）。減衰対象外なら null */
  daysUntilDecay: number | null;
  /** 残日数を埋め込んだ減衰アラート文言。Tier 1 / 決済なしなら null */
  alertMessage: string | null;
  /** 次ランクへ上がるための案内文。Tier 6（最上位）なら null */
  upgradeMessage: string | null;
};

/** (from, to] の半開区間に含まれる決済数。payments は昇順ソート済みであること */
function countInWindow(
  payments: readonly number[],
  fromExclusive: number,
  toInclusive: number,
): number {
  let count = 0;
  for (const p of payments) {
    if (p > fromExclusive && p <= toInclusive) count++;
  }
  return count;
}

/**
 * 時刻 t において「週 3 回ペース（trailing 7 日で 3 回以上）」が
 * 途切れず続いている開始時刻。t で満たしていなければ null。
 * 遡るのは spanMs までで、区間 [t - spanMs, t] をずっと満たしていれば t - spanMs を返す。
 *
 * count((s-7d, s]) はステップ関数で、各決済の流入時刻 p と流出時刻 p+7d でのみ
 * 変化する（どちらも右連続）。折れ点と区間端を昇順に評価し、
 * 末尾まで途切れなかった連続区間の先頭を返す。
 */
function weeklyPaceHeldSince(
  payments: readonly number[],
  t: number,
  spanMs: number,
): number | null {
  const start = t - spanMs;
  const points = new Set<number>([start, t]);
  for (const p of payments) {
    if (p >= start && p <= t) points.add(p);
    const exit = p + WEEK_MS;
    if (exit >= start && exit <= t) points.add(exit);
  }
  const candidates = [...points].sort((a, b) => a - b);

  let since: number | null = null;
  for (const c of candidates) {
    if (countInWindow(payments, c - WEEK_MS, c) >= WEEKLY_PACE_COUNT) {
      since ??= c;
    } else {
      since = null;
    }
  }
  return since;
}

/** 時刻 t において週 3 回ペースを直近 spanMs にわたり継続して満たしていたか。 */
function weeklyPaceMaintainedFor(
  payments: readonly number[],
  t: number,
  spanMs: number,
): boolean {
  return weeklyPaceHeldSince(payments, t, spanMs) === t - spanMs;
}

/**
 * 時刻 t において週 3 回ペースが連続して満たされ続けている長さ（ms）。
 * t で満たしていなければ 0、spanMs 以上ずっと満たしていれば spanMs（上限）。
 * Tier 4 → 5 / 5 → 6 の進捗（継続期間で昇格）を測るために使う。
 */
function weeklyPaceSustainedMs(
  payments: readonly number[],
  t: number,
  spanMs: number,
): number {
  const since = weeklyPaceHeldSince(payments, t, spanMs);
  return since == null ? 0 : t - since;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** 現在ティア内の「次ランクへの到達度」[0, 1]。Tier 6 は最上位なので常に 1。 */
function tierProgressFraction(
  payments: readonly number[],
  t: number,
  tier: Tier,
): number {
  switch (tier) {
    case 1: // → Tier 2: 累計 3 回
      return Math.min(payments.length, TIER2_TOTAL_COUNT) / TIER2_TOTAL_COUNT;
    case 2: // → Tier 3: 累計 9 回
      return Math.min(payments.length, TIER3_TOTAL_COUNT) / TIER3_TOTAL_COUNT;
    case 3: // → Tier 4: 直近 1 ヶ月で 12 回
      return (
        Math.min(
          countInWindow(payments, t - MONTH_MS, t),
          TIER4_MONTHLY_COUNT,
        ) / TIER4_MONTHLY_COUNT
      );
    case 4: // → Tier 5: 週 3 回ペースを 2 週間継続
      return (
        weeklyPaceSustainedMs(payments, t, TIER5_PACE_SPAN_MS) /
        TIER5_PACE_SPAN_MS
      );
    case 5: // → Tier 6: 週 3 回ペースを 3 ヶ月継続
      return (
        weeklyPaceSustainedMs(payments, t, TIER6_PACE_SPAN_MS) /
        TIER6_PACE_SPAN_MS
      );
    case 6: // 最上位
      return 1;
  }
}

/** 到達度 [0, 1] をバッジの 6 段階に量子化する（0 でも最小 1 を返す）。 */
function toProgressStep(fraction: number): ProgressStep {
  return clamp(Math.round(fraction * 6), 1, 6) as ProgressStep;
}

/**
 * 次ランクへ上がるための案内文。各ティアの昇格トリガーに対応した残り回数を示す。
 * 昇格は決済 1 件ごとに 1 段階のため「残り回数」は常に 1 以上。Tier 6 は最上位で null。
 */
function buildUpgradeMessage(
  payments: readonly number[],
  t: number,
  tier: Tier,
): string | null {
  switch (tier) {
    case 1: {
      // → Tier 2: 累計 3 回
      const n = Math.max(1, TIER2_TOTAL_COUNT - payments.length);
      return `あと${n}回の交換でステータスUP！`;
    }
    case 2: {
      // → Tier 3: 累計 9 回
      const n = Math.max(1, TIER3_TOTAL_COUNT - payments.length);
      return `あと${n}回の交換でステータスUP！`;
    }
    case 3: {
      // → Tier 4: 直近 1 ヶ月で 12 回
      const n = Math.max(
        1,
        TIER4_MONTHLY_COUNT - countInWindow(payments, t - MONTH_MS, t),
      );
      return `今月あと${n}回の交換でステータスUP！`;
    }
    case 4:
      // → Tier 5: 週 3 回ペースを 2 週間継続
      return "週3回の交換を2週間続けてステータスUP！";
    case 5:
      // → Tier 6: 週 3 回ペースを 3 ヶ月継続
      return "週3回の交換を3ヶ月続けてステータスUP！";
    case 6:
      return null; // 最高ランク
  }
}

/**
 * 時刻 t（その時点までの履歴）で満たしている最上位ティア（昇格トリガー基準）。
 * トリガーは必ずしも単調ではないため、満たす最大ティアを返す。
 */
function qualifiedTier(history: readonly number[], t: number): Tier {
  const total = history.length;
  let q: Tier = 1;
  if (total >= TIER2_TOTAL_COUNT) q = 2; // 累計 3 回以上
  if (total >= TIER3_TOTAL_COUNT) q = 3; // 累計 9 回以上
  if (countInWindow(history, t - MONTH_MS, t) >= TIER4_MONTHLY_COUNT) q = 4; // 月 12 回以上
  if (weeklyPaceMaintainedFor(history, t, TIER5_PACE_SPAN_MS)) q = 5; // 週 3 回ペースを 2 週間継続
  if (weeklyPaceMaintainedFor(history, t, TIER6_PACE_SPAN_MS)) q = 6; // 週 3 回ペースを 3 ヶ月継続
  return q;
}

export type ComputeForStatusInput = {
  /** 決済（送信）時刻の配列（ms）。順不同で可。受信は含めないこと */
  paymentTimestampsMs: readonly number[];
  /** 現在時刻（ms） */
  nowMs: number;
};

/**
 * 決済履歴と現在時刻から現在の FoR Status を再構成する。
 *
 * 昇格・減衰の「1 段階ずつ」ルールを満たすため、決済イベントと減衰イベントを
 * 時系列でシミュレートしてティアを進める。
 * - 決済イベント: その時点の昇格トリガーを満たす最上位ティアへ向けて 1 段階だけ昇格。
 * - 減衰イベント: 最終決済 + 維持日数を過ぎたら 1 段階ダウン（決済が来るまで連鎖）。
 */
export function computeForStatus({
  paymentTimestampsMs,
  nowMs,
}: ComputeForStatusInput): ForStatus {
  const payments = [...paymentTimestampsMs].sort((a, b) => a - b);

  let tier: Tier = 1;
  let peakTier: Tier = 1;
  let lastActivity: number | null = null;
  let i = 0;

  while (true) {
    const nextPayment =
      i < payments.length ? payments[i] : Number.POSITIVE_INFINITY;
    const maintDays = MAINTENANCE_DAYS[tier];
    const nextDecay =
      tier >= 2 && lastActivity != null && maintDays != null
        ? lastActivity + maintDays * DAY_MS
        : Number.POSITIVE_INFINITY;

    if (
      nextPayment === Number.POSITIVE_INFINITY &&
      nextDecay === Number.POSITIVE_INFINITY
    ) {
      break;
    }

    if (nextPayment <= nextDecay) {
      // 決済イベントを処理
      const t = nextPayment;
      lastActivity = t;
      const q = qualifiedTier(payments.slice(0, i + 1), t);
      if (q > tier) tier = (tier + 1) as Tier; // 一度に 1 段階のみ昇格
      if (tier > peakTier) peakTier = tier;
      i++;
    } else {
      // 減衰イベント。まだ現在時刻に達していなければ確定（ループ終了）。
      if (nextDecay > nowMs) break;
      tier = (tier - 1) as Tier; // 1 段階ダウン（lastActivity は据え置き）
    }
  }

  const maintDays = MAINTENANCE_DAYS[tier];
  const nextDecayAtMs =
    tier >= 2 && lastActivity != null && maintDays != null
      ? lastActivity + maintDays * DAY_MS
      : null;
  const daysUntilDecay =
    nextDecayAtMs != null
      ? Math.max(0, Math.ceil((nextDecayAtMs - nowMs) / DAY_MS))
      : null;
  const template = ALERT_TEMPLATES[tier];
  const alertMessage =
    template != null && daysUntilDecay != null
      ? template.replace("{days}", String(daysUntilDecay))
      : null;

  const progress = toProgressStep(tierProgressFraction(payments, nowMs, tier));
  const upgradeMessage = buildUpgradeMessage(payments, nowMs, tier);

  const info = TIER_INFO[tier];
  return {
    tier,
    peakTier,
    nameJa: info.nameJa,
    nameEn: info.nameEn,
    progress,
    lastActivityMs: lastActivity,
    nextDecayAtMs,
    daysUntilDecay,
    alertMessage,
    upgradeMessage,
  };
}
