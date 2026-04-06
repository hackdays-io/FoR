import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { getNamesByAddress } from "~/lib/namestone.server";
import type { Route } from "./+types/users.$address";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ユーザープロフィール | FoR" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { address } = params;

  try {
    const profiles = await getNamesByAddress(address);
    const profile = profiles.length > 0 ? profiles[0] : null;
    return { profile, address };
  } catch {
    return { profile: null, address };
  }
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function UserProfile({ loaderData }: Route.ComponentProps) {
  const { profile, address } = loaderData;
  const navigate = useNavigate();

  const displayName =
    profile?.text_records?.display || profile?.name || shortenAddress(address);

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>プロフィール</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-col items-center gap-16 px-20 py-32">
        <Avatar
          src={profile?.text_records?.avatar}
          alt={displayName}
          size="lg"
        />

        <div className="flex flex-col items-center gap-4">
          <p className="text-content-headline-m font-bold text-text-default">
            {displayName}
          </p>
          {profile?.name && (
            <p className="text-ui-13 text-text-subtle">
              {profile.name}.{profile.domain}
            </p>
          )}
          <p className="text-ui-10 text-text-hint">
            {shortenAddress(address)}
          </p>
        </div>

        {profile?.text_records?.description && (
          <p className="w-full text-content-body-m text-text-default">
            {profile.text_records.description}
          </p>
        )}

        {!profile && (
          <p className="text-ui-13 text-text-hint">
            プロフィールが設定されていません
          </p>
        )}
      </div>
    </div>
  );
}
