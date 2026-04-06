import type { Route } from "./+types/send";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "トークン送信 | FoR" }];
}

export default function Send() {
  return (
    <div>
      <h1>トークン送信</h1>
    </div>
  );
}
