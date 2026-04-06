import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { getNamesByAddress } from "~/lib/namestone.server";
import { Typography } from "~/components/ui/typography";
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
          <Typography variant="headline-m" className="text-text-default">
            {displayName}
          </Typography>
          {profile?.name && (
            <Typography variant="ui-13" className="text-text-subtle">
              {profile.name}.{profile.domain}
            </Typography>
          )}
          <Typography variant="ui-10" className="text-text-hint">
            {shortenAddress(address)}
          </Typography>
        </div>

        {profile?.text_records?.description && (
          <Typography variant="body-m" className="w-full text-text-default">
            {profile.text_records.description}
          </Typography>
        )}

        {!profile && (
          <Typography variant="ui-13" className="text-text-hint">
            プロフィールが設定されていません
          </Typography>
        )}
      </div>
    </div>
  );
}
