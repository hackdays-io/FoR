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
// "1-bee.png" のような level-animal の静的バッジ（フォールバック用）。
const STATIC_BADGE_PATTERN = /\/([1-6])-[a-z]+\.png$/;
const staticBadgeByTier = new Map<string, string>();
for (const [path, url] of Object.entries(badgeModules)) {
  const progressMatch = path.match(PROGRESS_BADGE_PATTERN);
  if (progressMatch) {
    badgeByTierProgress.set(`${progressMatch[1]}-${progressMatch[2]}`, url);
    continue;
  }
  const staticMatch = path.match(STATIC_BADGE_PATTERN);
  if (staticMatch) staticBadgeByTier.set(staticMatch[1], url);
}

/**
 * ティア × 進捗に対応するバッジ画像 URL を返す。
 *
 * 進捗付きバッジが見つからない場合はそのティアの静的バッジにフォールバックする。
 * 描画中に呼ばれるため、画像欠落でも例外を投げず（= 画面クラッシュさせず）、
 * 最終手段として空文字を返す。
 */
export function getBadgeImage(tier: Tier, progress: ProgressStep): string {
  const url =
    badgeByTierProgress.get(`${tier}-${progress}`) ??
    staticBadgeByTier.get(String(tier));
  if (!url) {
    if (import.meta.env?.DEV) {
      console.warn(
        `バッジ画像が見つかりません: tier=${tier} progress=${progress}`,
      );
    }
    return "";
  }
  return url;
}

/**
 * ティアの静的バッジ（進捗リングなし `<level>-<animal>.png`）の画像 URL を返す。
 * ステータス一覧（種類グリッド）で各ティアの代表アイコンを表示するのに使う。
 * 画像欠落でも例外を投げず空文字を返す。
 */
export function getStaticBadgeImage(tier: Tier): string {
  return staticBadgeByTier.get(String(tier)) ?? "";
}
