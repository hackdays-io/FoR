import { useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
import { getNamesByAddress } from "~/lib/namestone.server";
import type { Route } from "./+types/users.$address";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プロフィール | FoR" }];
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
  const description = profile?.text_records?.description;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>{displayName}</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-1 flex-col items-center gap-24 px-20 pt-40">
        <Avatar
          src={profile?.text_records?.avatar}
          alt={displayName}
          size="lg"
        />

        <Typography variant="headline-m" className="text-text-default">
          {displayName}
        </Typography>

        {description && (
          <Typography
            variant="body-m"
            className="w-full whitespace-pre-wrap text-text-default"
          >
            {description}
          </Typography>
        )}
      </div>

      <div className="sticky bottom-0 flex justify-center bg-bg-default px-20 py-16">
        <Button
          onClick={() => navigate(`/send?to=${address}`)}
          className="w-full"
        >
          送る
        </Button>
      </div>
    </div>
  );
}
