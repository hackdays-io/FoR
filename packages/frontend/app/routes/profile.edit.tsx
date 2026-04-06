import type { Route } from "./+types/profile.edit";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プロフィール編集 | FoR" }];
}

export default function ProfileEdit() {
  return (
    <div>
      <h1>プロフィール編集</h1>
    </div>
  );
}
