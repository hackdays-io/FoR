// ティア × 進捗 → プログレスバー付きバッジ画像のマッピング。
// ファイル名は `<level>-<animal>-<progress>.png`（外周リングが 6 段階で埋まる版）。
// 静的バッジ `<level>-<animal>.png` や locked `6-wolf-locked-*.png` は対象外。
import type { ProgressStep, Tier } from "~/lib/for-status";

// 全バッジ画像を一括読み込みし、`<level>-<progress>` キーで引けるようにする。
const badgeModules = import.meta.glob("../assets/images/badges/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// "1-bee-3.png" のような level-animal-progress のみ抽出（locked / 静的は除外）。
const PROGRESS_BADGE_PATTERN = /\/([1-6])-[a-z]+-([1-6])\.png$/;
const badgeByTierProgress = new Map<string, string>();
for (const [path, url] of Object.entries(badgeModules)) {
  const m = path.match(PROGRESS_BADGE_PATTERN);
  if (m) badgeByTierProgress.set(`${m[1]}-${m[2]}`, url);
}

export function getBadgeImage(tier: Tier, progress: ProgressStep): string {
  const url = badgeByTierProgress.get(`${tier}-${progress}`);
  if (!url) {
    throw new Error(
      `バッジ画像が見つかりません: tier=${tier} progress=${progress}`,
    );
  }
  return url;
}
