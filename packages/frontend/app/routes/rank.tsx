import type { Route } from "./+types/rank";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ランク | FoR" }];
}

export default function Rank() {
  return (
    <div>
      <h1>ランク</h1>
    </div>
  );
}
