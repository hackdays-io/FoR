import type { Route } from "./+types/profile.create";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プロフィール作成 | FoR" }];
}

export default function ProfileCreate() {
  return (
    <div>
      <h1>プロフィール作成</h1>
    </div>
  );
}
