import { ens_normalize } from "@adraffy/ens-normalize";
import { searchNames } from "~/lib/namestone.server";
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

  // 編集時、現在の自分のユーザー名はそのまま使用可能とみなす
  if (current && name === current) {
    return { available: true };
  }

  try {
    ens_normalize(name);
  } catch {
    return { available: false };
  }

  try {
    const results = await searchNames(name, true);
    return { available: results.length === 0 };
  } catch {
    return { available: null };
  }
}
