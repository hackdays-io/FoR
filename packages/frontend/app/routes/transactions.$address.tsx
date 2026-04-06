import type { Route } from "./+types/transactions.$address";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "やりとり詳細 | FoR" }];
}

export default function TransactionDetail({ params }: Route.ComponentProps) {
  return (
    <div>
      <h1>やりとり詳細</h1>
    </div>
  );
}
