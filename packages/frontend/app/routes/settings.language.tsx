import type { Route } from "./+types/settings.language";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "言語設定 | FoR" }];
}

export default function SettingsLanguage() {
  return (
    <div>
      <h1>言語設定</h1>
    </div>
  );
}
