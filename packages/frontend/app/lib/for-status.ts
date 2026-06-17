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
// - Tier 6 は「直近 1 ヶ月、週 3 回以上の決済を継続」で判定する。

export type Tier = 1 | 2 | 3 | 4 | 5 | 6;

export const TIERS: readonly Tier[] = [1, 2, 3, 4, 5, 6];

// バッジ外周リングの進捗段階（1 = 入りたて・最小、6 = 次ランク目前・フル）。
export type ProgressStep = 1 | 2 | 3 | 4 | 5 | 6;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

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
 * 時刻 t において「フクロウ条件（trailing 7 日で 3 回以上）」が
 * 直近 1 ヶ月にわたり継続して満たされていたか。
 *
 * 連続条件 min_{s ∈ [t-30d, t]} count((s-7d, s]) >= 3 を、ステップ関数の
 * 折れ点（各決済の流入時刻と 7 日後の流出時刻）と区間端で評価して判定する。
 */
function owlMaintainedForMonth(
  payments: readonly number[],
  t: number,
): boolean {
  const start = t - MONTH_MS;
  const candidates = new Set<number>([start, t]);
  for (const p of payments) {
    if (p >= start && p <= t) candidates.add(p);
    const exit = p + WEEK_MS;
    if (exit >= start && exit <= t) candidates.add(exit);
  }
  for (const c of candidates) {
    if (countInWindow(payments, c - WEEK_MS, c) < 3) return false;
  }
  return true;
}

/**
 * 時刻 t において owl 条件（trailing 7 日で 3 回以上）が
 * 連続して満たされ続けている長さ（ms）。t で満たしていなければ 0。
 * Tier 5 → 6 の進捗（1 ヶ月継続で昇格）を測るために使う。
 * 上限は 1 ヶ月（それ以上は昇格扱いなので測る意味がない）。
 */
function owlSustainedMs(payments: readonly number[], t: number): number {
  if (countInWindow(payments, t - WEEK_MS, t) < 3) return 0;
  // 条件は決済の流入(p)・流出(p+7d)でのみ変化する。t から最大 1 ヶ月遡り、
  // 直近で条件を満たさなくなった折れ点を探す。owlMaintainedForMonth と同じ判定式。
  const start = t - MONTH_MS;
  const candidates: number[] = [];
  for (const p of payments) {
    if (p >= start && p < t) candidates.push(p);
    const exit = p + WEEK_MS;
    if (exit >= start && exit < t) candidates.push(exit);
  }
  candidates.sort((a, b) => b - a); // 降順（新しい順）
  for (const c of candidates) {
    if (countInWindow(payments, c - WEEK_MS, c) < 3) return t - c;
  }
  return MONTH_MS; // 1 ヶ月以上ずっと満たしていた
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
    case 1: // → Tier 2: 初回決済（累計 1 回）
      return payments.length >= 1 ? 1 : 0;
    case 2: // → Tier 3: 累計 3 回
      return Math.min(payments.length, 3) / 3;
    case 3: // → Tier 4: 直近 1 ヶ月で 4 回
      return Math.min(countInWindow(payments, t - MONTH_MS, t), 4) / 4;
    case 4: // → Tier 5: 直近 7 日で 3 回
      return Math.min(countInWindow(payments, t - WEEK_MS, t), 3) / 3;
    case 5: // → Tier 6: owl 条件を 1 ヶ月継続
      return owlSustainedMs(payments, t) / MONTH_MS;
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
      // → Tier 2: 初回決済（累計 1 回）
      const n = Math.max(1, 1 - payments.length);
      return `あと${n}回の交換でステータスUP！`;
    }
    case 2: {
      // → Tier 3: 累計 3 回
      const n = Math.max(1, 3 - payments.length);
      return `あと${n}回の交換でステータスUP！`;
    }
    case 3: {
      // → Tier 4: 直近 1 ヶ月で 4 回
      const n = Math.max(1, 4 - countInWindow(payments, t - MONTH_MS, t));
      return `今月あと${n}回の交換でステータスUP！`;
    }
    case 4: {
      // → Tier 5: 直近 7 日で 3 回
      const n = Math.max(1, 3 - countInWindow(payments, t - WEEK_MS, t));
      return `今週あと${n}回の交換でステータスUP！`;
    }
    case 5:
      // → Tier 6: 週 3 回以上を 1 ヶ月継続
      return "週3回の交換を1ヶ月続けてステータスUP！";
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
  if (total >= 1) q = 2; // 初回決済完了
  if (total >= 3) q = 3; // 累計 3 回以上
  if (countInWindow(history, t - MONTH_MS, t) >= 4) q = 4; // 月 4 回以上
  if (countInWindow(history, t - WEEK_MS, t) >= 3) q = 5; // 週 3 回以上
  if (owlMaintainedForMonth(history, t)) q = 6; // フクロウを 1 ヶ月維持
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
