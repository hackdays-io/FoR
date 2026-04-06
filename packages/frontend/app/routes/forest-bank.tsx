import type { Route } from "./+types/forest-bank";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "森の貯金箱 | FoR" }];
}

export default function ForestBank() {
  return (
    <div>
      <h1>森の貯金箱</h1>
    </div>
  );
}
