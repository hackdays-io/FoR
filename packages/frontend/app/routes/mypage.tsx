import { useEffect } from "react";
import { Link, useFetcher } from "react-router";
import {
  AppBar,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import type { NameStoneProfile } from "~/lib/namestone.server";
import type { Route } from "./+types/mypage";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "マイページ | FoR" }];
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Mypage() {
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const fetcher = useFetcher<{ profile: NameStoneProfile | null }>();

  useEffect(() => {
    if (address && fetcher.state === "idle" && !fetcher.data) {
      fetcher.load(`/api/profile/${address}`);
    }
  }, [address, fetcher]);

  const profile = fetcher.data?.profile;
  const isLoading = isWalletLoading || fetcher.state === "loading";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-default">
        <AppBar>
          <AppBarItem position="center">
            <AppBarTitle>マイページ</AppBarTitle>
          </AppBarItem>
        </AppBar>
        <div className="flex items-center justify-center py-32">
          <p className="text-ui-13 text-text-hint">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-bg-default">
        <AppBar>
          <AppBarItem position="center">
            <AppBarTitle>マイページ</AppBarTitle>
          </AppBarItem>
        </AppBar>
        <div className="flex flex-col items-center gap-16 px-20 py-32">
          <p className="text-ui-13 text-text-hint">
            ウォレットが接続されていません
          </p>
          <Link to="/">
            <Button>ログインへ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    profile?.text_records?.display || profile?.name || shortenAddress(address);

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="center">
          <AppBarTitle>マイページ</AppBarTitle>
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

        {profile ? (
          <Link to={`/profile/edit?address=${address}`} className="w-full">
            <Button variant="secondary" className="w-full">
              プロフィールを編集
            </Button>
          </Link>
        ) : (
          <Link to="/profile/create" className="w-full">
            <Button className="w-full">プロフィールを作成</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
