import type { Route } from "./+types/settings.delete-account";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アカウント削除 | FoR" }];
}

export default function SettingsDeleteAccount() {
  return (
    <div>
      <h1>アカウント削除</h1>
    </div>
  );
}
