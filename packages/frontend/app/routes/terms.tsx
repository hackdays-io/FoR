import type { Route } from "./+types/terms";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "利用規約 | FoR" }];
}

export default function Terms() {
  return (
    <div>
      <h1>利用規約</h1>
    </div>
  );
}
