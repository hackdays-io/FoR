import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { Link, useFetcher, useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Typography } from "~/components/ui/typography";
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
  const { logout } = usePrivy();
  const navigate = useNavigate();
  const fetcher = useFetcher<{ profile: NameStoneProfile | null }>();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
          <AppBarItem position="left">
            <AppBarBackButton onClick={() => navigate("/")} />
          </AppBarItem>
          <AppBarItem position="center">
            <AppBarTitle>マイページ</AppBarTitle>
          </AppBarItem>
        </AppBar>
        <div className="flex items-center justify-center py-32">
          <Typography variant="ui-13" className="text-text-hint">
            読み込み中...
          </Typography>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="min-h-screen bg-bg-default">
        <AppBar>
          <AppBarItem position="left">
            <AppBarBackButton onClick={() => navigate("/")} />
          </AppBarItem>
          <AppBarItem position="center">
            <AppBarTitle>マイページ</AppBarTitle>
          </AppBarItem>
        </AppBar>
        <div className="flex flex-col items-center gap-16 px-20 py-32">
          <Typography variant="ui-13" className="text-text-hint">
            ウォレットが接続されていません
          </Typography>
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
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate("/")} />
        </AppBarItem>
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

        <Button variant="secondary" className="w-full" onClick={handleLogout}>
          ログアウト
        </Button>

        {/* {profile ? (
          <Link
            to={`/settings/delete-account?address=${address}`}
            className="w-full"
          >
            <Button variant="ghost" className="w-full text-text-danger-default">
              アカウントを削除
            </Button>
          </Link>
        ) : null} */}
      </div>
    </div>
  );
}
