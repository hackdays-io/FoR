import type { Route } from "./+types/osusowake";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそ分け一覧 | FoR" }];
}

export default function OsusowakeList() {
  return (
    <div>
      <h1>おすそ分け一覧</h1>
    </div>
  );
}
