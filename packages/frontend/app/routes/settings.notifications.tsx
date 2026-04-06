import type { Route } from "./+types/settings.notifications";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "お知らせ受信設定 | FoR" }];
}

export default function SettingsNotifications() {
  return (
    <div>
      <h1>お知らせ受信設定</h1>
    </div>
  );
}
