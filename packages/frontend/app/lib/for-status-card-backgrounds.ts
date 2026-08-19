// ティア → ウォレットカード背景画像のマッピング。
// ファイル名は `<level>-<animal>-card-background.jpg`。
// Tier 1（ミツバチ）は専用背景を持たず、呼び出し側でデフォルト背景に
// フォールバックさせるため undefined を返す。
import type { Tier } from "~/lib/for-status";

import squirrelCardBackground from "~/assets/images/cards/2-squirrel-card-background.jpg";
import birdCardBackground from "~/assets/images/cards/3-bird-card-background.jpg";
import deerCardBackground from "~/assets/images/cards/4-deer-card-background.jpg";
import owlCardBackground from "~/assets/images/cards/5-owl-card-background.jpg";
import wolfCardBackground from "~/assets/images/cards/6-wolf-card-background.jpg";

const CARD_BACKGROUND_BY_TIER: Partial<Record<Tier, string>> = {
  2: squirrelCardBackground,
  3: birdCardBackground,
  4: deerCardBackground,
  5: owlCardBackground,
  6: wolfCardBackground,
};

/**
 * ティアに対応するウォレットカードの背景画像 URL を返す。
 * 専用背景を持たないティア（Tier 1）では undefined を返し、
 * 呼び出し側で Card のデフォルト背景を使わせる。
 */
export function getCardBackgroundImage(tier: Tier): string | undefined {
  return CARD_BACKGROUND_BY_TIER[tier];
}
