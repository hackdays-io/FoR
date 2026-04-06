import type { Route } from "./+types/mypage";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "マイページ | FoR" }];
}

export default function Mypage() {
  return (
    <div>
      <h1>マイページ</h1>
    </div>
  );
}
