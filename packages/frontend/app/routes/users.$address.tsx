import type { Route } from "./+types/users.$address";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ユーザープロフィール | FoR" }];
}

export default function UserProfile({ params }: Route.ComponentProps) {
  return (
    <div>
      <h1>ユーザープロフィール</h1>
    </div>
  );
}
