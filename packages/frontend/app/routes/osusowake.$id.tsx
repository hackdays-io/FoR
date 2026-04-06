import type { Route } from "./+types/osusowake.$id";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "おすそ分け詳細 | FoR" }];
}

export default function OsusowakeDetail({ params }: Route.ComponentProps) {
  return (
    <div>
      <h1>おすそ分け詳細</h1>
    </div>
  );
}
