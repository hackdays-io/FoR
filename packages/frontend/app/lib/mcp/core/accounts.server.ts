import { isAddress } from "viem";
import { getNameByLabel } from "~/lib/namespace.server";
import type { ProfileView } from "./present";
import { resolveProfile, toProfileView } from "./profiles.server";

/**
 * ツールが受け取る `account` は 3 通りの書き方を許す。
 *   - 0x… のウォレットアドレス
 *   - alice.toban.eth のようなフルネーム
 *   - alice のようなラベル（親名は環境変数 NAMESPACE_PARENT_NAME）
 */
export async function resolveAccount(
  input: string,
): Promise<ProfileView | null> {
  const value = input.trim();
  if (!value) return null;

  if (value.startsWith("0x")) {
    if (!isAddress(value)) return null;
    return resolveProfile(value);
  }

  const parentName = process.env.NAMESPACE_PARENT_NAME;
  // フルネームで来た場合はラベル部分だけを取り出す。
  // toban は `foo.split.toban.eth` のようなドット入りラベルも登録しているため、
  // 単純な split(".")[0] ではなく親名のサフィックスで切り落とす。
  const label =
    parentName && value.endsWith(`.${parentName}`)
      ? value.slice(0, -(parentName.length + 1))
      : value;

  const profile = await getNameByLabel(label);
  if (!profile?.address) return null;

  return toProfileView(profile);
}

/** 解決できなかったときに返す説明文。ツール間で文言を揃える */
export function accountNotFoundMessage(input: string): string {
  return `アカウント "${input}" を解決できませんでした。0x… のアドレス、alice.${
    process.env.NAMESPACE_PARENT_NAME ?? "toban.eth"
  }、または alice のようなユーザー名を指定してください。`;
}
