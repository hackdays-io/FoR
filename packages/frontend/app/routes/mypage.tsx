import { usePrivy } from "@privy-io/react-auth";
import { Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { NavListRow } from "~/components/ui/nav-list-row";
import { SectionTitle } from "~/components/ui/section-title";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useProfileByAddress } from "~/hooks/useProfileByAddress";
import type { Route } from "./+types/mypage";

// 外部リンク（コミュニティ・お問い合わせ）の遷移先
// TODO: 正式な URL が決まり次第差し替える
const COMMUNITY_URL =
  "https://www.figma.com/design/EPgo5kzk5BIHbCGr5WXBxs/FoR-wallet-app";
const CONTACT_URL =
  "https://www.figma.com/design/EPgo5kzk5BIHbCGr5WXBxs/FoR-wallet-app";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "マイページ | FoR" }];
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Mypage() {
  const { address } = useActiveWallet();
  const { logout } = usePrivy();
  const navigate = useNavigate();
  // プロフィールは AuthGate と同じ react-query キャッシュを共有
  const { data: profile } = useProfileByAddress(address);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // AuthGate がウォレット接続を保証済み。ここは型ガードのための保険
  if (!address) return null;

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

      <div className="flex flex-col gap-32 px-20 py-32">
        {/* プロフィールヘッダー */}
        <div className="flex flex-col gap-16">
          <div className="flex flex-col items-center gap-16">
            <Avatar
              src={profile?.text_records?.avatar}
              alt={displayName}
              size="lg"
            />
            <Typography variant="headline-m" className="text-text-default">
              {displayName}
            </Typography>
          </div>

          {profile?.text_records?.description && (
            <Typography variant="body-m" className="w-full text-text-subtle">
              {profile.text_records.description}
            </Typography>
          )}

          {profile ? (
            <Link
              to={`/profile/edit?address=${address}`}
              className="inline-flex items-center gap-4 self-end text-ui-13 font-bold text-text-default"
            >
              <Pencil size={16} aria-hidden="true" />
              プロフィールを編集
            </Link>
          ) : (
            <Link to="/profile/create" className="self-end">
              <Button variant="secondary">プロフィールを作成</Button>
            </Link>
          )}
        </div>

        {/* その他 */}
        <div className="flex flex-col">
          <SectionTitle>その他</SectionTitle>
          <NavListRow label="プライバシーポリシー" to="/privacy" />
          <NavListRow label="利用規約" to="/terms" />
          <NavListRow label="コミュニティ" href={COMMUNITY_URL} />
          <NavListRow label="お問い合わせ" href={CONTACT_URL} />
        </div>

        <Button
          variant="secondary"
          className="mt-16 w-full"
          onClick={handleLogout}
        >
          ログアウト
        </Button>
      </div>
    </div>
  );
}
