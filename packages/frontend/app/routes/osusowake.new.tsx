import type { Route } from "./+types/osusowake.new";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそ分け追加 | FoR" }];
}

export default function OsusowakeNew() {
  return (
    <div>
      <h1>おすそ分け追加</h1>
    </div>
  );
}
