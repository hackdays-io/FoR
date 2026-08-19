// FoR Status（ランク）の表示用コピー。
//
// `for-status.ts` は昇格・減衰の純粋ロジック、こちらは画面に出す文言（カタカナ表記・
// 一覧グリッドのキャッチコピー・現在ステータスの説明文）を集約する。ロジックと文言を
// 分離しておくことで、コピー調整でロジックに触れずに済む。
import type { Tier } from "~/lib/for-status";
import { TIERS } from "~/lib/for-status";

export type TierContent = {
  tier: Tier;
  /** 英語名（見出し用）。例: "Honeybee" */
  nameEn: string;
  /** 日本語名（カタカナ表記）。例: "ミツバチ" */
  nameJa: string;
  /** 一覧グリッド用の短いキャッチコピー */
  tagline: string;
  /** 現在ステータス画面のヒーロー本文（そのティアの世界観を伝える説明文） */
  description: string;
};

const TIER_CONTENT: Record<Tier, TierContent> = {
  1: {
    tier: 1,
    nameEn: "Honeybee",
    nameJa: "ミツバチ",
    tagline: "小さな行為で、受粉を助ける循環の運び手",
    description:
      "小さな一歩から、森の循環がはじまります。あなたのケアが、めぐりの最初のひと押しです。",
  },
  2: {
    tier: 2,
    nameEn: "Squirrel",
    nameJa: "リス",
    tagline: "あちこちに種を埋める未来の作り手",
    description:
      "森のあちこちに種をまくように、あなたのFoRが未来の芽を育てています。",
  },
  3: {
    tier: 3,
    nameEn: "Bird",
    nameJa: "トリ",
    tagline: "遠くへ声を届け、点と線をつないでいく森の繋ぎ手",
    description:
      "遠くまで声を届けるように、あなたのつながりが森の点と点を結んでいます。",
  },
  4: {
    tier: 4,
    nameEn: "Deer",
    nameJa: "シカ",
    tagline: "森を美しく整え、光の道をつくる調和の象徴",
    description:
      "森を美しく整える歩みのように、あなたのケアが調和をつくり出しています。",
  },
  5: {
    tier: 5,
    nameEn: "Owl",
    nameJa: "フクロウ",
    tagline: "深い知恵で森の行く末を見極める賢い森の守り手",
    description:
      "深い知恵で森を見守るように、あなたのFoRが循環の秩序を支えています。",
  },
  6: {
    tier: 6,
    nameEn: "Wolf",
    nameJa: "オオカミ",
    tagline: "豊かに実り、次世代を育むリターンを生み出す最高位。",
    description:
      "豊かな実りをもたらす最高位。あなたの循環が、次の世代へと森をつないでいます。",
  },
};

export function getTierContent(tier: Tier): TierContent {
  return TIER_CONTENT[tier];
}

/** 一覧グリッド表示用に全ティアのコピーをティア昇順で返す。 */
export const TIER_CONTENT_LIST: readonly TierContent[] = TIERS.map(
  (tier) => TIER_CONTENT[tier],
);
