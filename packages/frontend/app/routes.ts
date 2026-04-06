import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  // ホーム（ログイン/ホーム）
  index("routes/home.tsx"),

  // 利用規約・プライバシー
  route("terms", "routes/terms.tsx"),
  route("privacy", "routes/privacy.tsx"),

  // プロフィール
  route("profile/create", "routes/profile.create.tsx"),
  route("profile/edit", "routes/profile.edit.tsx"),

  // マイページ
  route("mypage", "routes/mypage.tsx"),

  // 設定
  route("settings/notifications", "routes/settings.notifications.tsx"),
  route("settings/language", "routes/settings.language.tsx"),
  route("settings/delete-account", "routes/settings.delete-account.tsx"),

  // ランク
  route("rank", "routes/rank.tsx"),

  // 森の貯金箱
  route("forest-bank", "routes/forest-bank.tsx"),
  route("forest-bank/contributions", "routes/forest-bank.contributions.tsx"),

  // 送受信履歴
  route("transactions", "routes/transactions.tsx"),
  route("transactions/:address", "routes/transactions.$address.tsx"),

  // ユーザープロフィール
  route("users/:address", "routes/users.$address.tsx"),

  // API
  route("api/profile/:address", "routes/api.profile.$address.tsx"),

  // トークン送信・受取・スキャン
  route("send", "routes/send.tsx"),
  route("receive", "routes/receive.tsx"),
  route("scan", "routes/scan.tsx"),

  // おすそ分け
  route("osusowake", "routes/osusowake.tsx"),
  route("osusowake/new", "routes/osusowake.new.tsx"),
  route("osusowake/:id", "routes/osusowake.$id.tsx"),
] satisfies RouteConfig;
