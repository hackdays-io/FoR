import type { Route } from "./+types/privacy";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プライバシーポリシー | FoR" }];
}

export default function Privacy() {
  return (
    <div>
      <h1>プライバシーポリシー</h1>
    </div>
  );
}
