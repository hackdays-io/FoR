import type { Route } from "./+types/transactions";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "送る受け取る履歴 | FoR" }];
}

export default function Transactions() {
  return (
    <div>
      <h1>送る受け取る履歴</h1>
    </div>
  );
}
