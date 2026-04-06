import type { Route } from "./+types/receive";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "受取QRコード | FoR" }];
}

export default function Receive() {
  return (
    <div>
      <h1>受取QRコード</h1>
    </div>
  );
}
