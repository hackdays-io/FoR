// ティア → バッジ画像のマッピング。
// 画像は後ほど差し替え予定のため、`rankbadge_<tier>.png` 形式のファイル名で配置している。
// 現状はプレースホルダ画像。同名で差し替えるだけで反映される。
import rankbadge1 from "~/assets/images/badges/rankbadge_1.png";
import rankbadge2 from "~/assets/images/badges/rankbadge_2.png";
import rankbadge3 from "~/assets/images/badges/rankbadge_3.png";
import rankbadge4 from "~/assets/images/badges/rankbadge_4.png";
import rankbadge5 from "~/assets/images/badges/rankbadge_5.png";
import rankbadge6 from "~/assets/images/badges/rankbadge_6.png";
import type { Tier } from "~/lib/for-status";

const BADGE_IMAGE_BY_TIER: Record<Tier, string> = {
  1: rankbadge1,
  2: rankbadge2,
  3: rankbadge3,
  4: rankbadge4,
  5: rankbadge5,
  6: rankbadge6,
};

export function getBadgeImage(tier: Tier): string {
  return BADGE_IMAGE_BY_TIER[tier];
}
