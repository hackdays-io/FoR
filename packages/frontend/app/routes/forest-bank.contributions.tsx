import type { Route } from "./+types/forest-bank.contributions";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "みんなの貢献履歴一覧 | FoR" }];
}

export default function Contributions() {
  return (
    <div>
      <h1>みんなの貢献履歴一覧</h1>
    </div>
  );
}
