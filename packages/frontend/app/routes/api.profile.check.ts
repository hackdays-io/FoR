import { isSameLabel, normalizeLabel } from "~/lib/label";
import { isNameAvailable } from "~/lib/namespace.server";
import type { Route } from "./+types/api.profile.check";

// ユーザー名が使用可能かを判定する共有エンドポイント。
// 作成画面・編集画面の両方から fetcher 経由で利用する。
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  const current = url.searchParams.get("current");

  if (!name) {
    return { available: null };
  }

  // 編集時、現在の自分のユーザー名は表記揺れ（大文字小文字）込みでそのまま使用可能とみなす
  if (current && isSameLabel(name, current)) {
    return { available: true };
  }

  // 登録時と同じ正規化後の文字列で判定する
  let normalized: string;
  try {
    normalized = normalizeLabel(name);
  } catch {
    return { available: false };
  }

  try {
    return { available: await isNameAvailable(normalized) };
  } catch {
    return { available: null };
  }
}
