import { useLogin, usePrivy } from "@privy-io/react-auth";
import { Link, useLoaderData, useNavigate } from "react-router";
import { formatUnits } from "viem";
import logoMain from "~/assets/images/logo/logo-main.png";
import logoTagline from "~/assets/images/logo/logo-tagline.png";
import { LoadingScreen } from "~/components/loading-screen";
import { MainBottomNavigation } from "~/components/main-bottom-navigation";
import { OsusowakeCards } from "~/components/osusowake-cards";
import { ProfileListRow } from "~/components/profile-list-row";
import {
  AppBar,
  AppBarItem,
  AppBarLogo,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { SectionTitle } from "~/components/ui/section-title";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useForTokenBalance } from "~/hooks/useForToken";
import { useProfileByAddress } from "~/hooks/useProfileByAddress";
import { useTransfersViaRouter } from "~/hooks/useTransfersViaRouter";
import { loadOsusowakeItems } from "~/lib/osusowake.server";
import { parseMessagePayload } from "~/lib/transfer-message";
import { formatTimestamp } from "~/lib/utils";
import type { Route } from "./+types/home";

export async function loader() {
  // defer: Promise のまま返してストリーミングする
  // （home 本体の描画・遷移を Google Sheets 取得でブロックしない）
  return { osusowakeItems: loadOsusowakeItems() };
}

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "FoR" },
    {
      name: "description",
      content: "FoR - Distribution Transfer System",
    },
  ];
}

function LoginScreen() {
  const { login } = useLogin();

  return (
    <div className="flex min-h-dvh flex-col bg-bg-default px-20">
      {/* Logo */}
      <div className="flex flex-1 flex-col items-center justify-center gap-16">
        <img
          src={logoMain}
          alt="FoR"
          className="h-[75px] w-[75px] object-contain"
        />
        <img
          src={logoTagline}
          alt="ForForest. ForPlanet. ForUs."
          className="w-[120px] object-contain"
        />
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-16 pb-40">
        {/* Button */}
        <Button onClick={() => login()} className="w-full">
          はじめる
        </Button>
      </div>
    </div>
  );
}

function AuthenticatedHome() {
  const navigate = useNavigate();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { data: balance, isLoading: isBalanceLoading } =
    useForTokenBalance(address);
  const { data: transfers, isLoading: isTransfersLoading } =
    useTransfersViaRouter(address, 3);
  // プロフィール表示用（AuthGate と同じ react-query キャッシュを共有）
  const { data: profile } = useProfileByAddress(address);
  const { osusowakeItems } = useLoaderData<typeof loader>();

  if (isWalletLoading || !address) {
    return <LoadingScreen />;
  }

  const displayName = profile?.text_records?.display || profile?.name || "";

  return (
    <div className="min-h-dvh bg-bg-default pb-[100px]">
      {/* Header */}
      <AppBar>
        <AppBarItem position="left">
          <AppBarLogo />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>{displayName}</AppBarTitle>
        </AppBarItem>
        <AppBarItem position="right">
          <Link to="/mypage">
            <Avatar
              src={profile?.text_records?.avatar}
              alt={displayName}
              size="sm"
            />
          </Link>
        </AppBarItem>
      </AppBar>

      {/* Tabs */}
      <Tabs defaultValue="my-wallet" variant="underline">
        <TabsList>
          <TabsTrigger value="my-wallet">あなたのウォレット</TabsTrigger>
          <TabsTrigger
            value="forest-wallet"
            onClick={() => navigate("/forest-bank")}
          >
            森の再生基金
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="flex flex-col gap-24 px-20 pt-20">
        {/* Wallet Card */}
        <Card
          variant="wallet"
          amount={
            isBalanceLoading ? "--" : balance ? Number(balance.formatted) : 0
          }
          topProps={
            {
              // badgeImage: "",
            }
          }
        />

        {/* Transaction History */}
        <div>
          <SectionTitle
            moreLabel="もっとみる"
            onMoreClick={() => navigate("/transactions")}
          >
            履歴
          </SectionTitle>
          <div className="mt-8">
            {isTransfersLoading ? null : !transfers ||
              transfers.length === 0 ? (
              <p className="py-12 text-center text-ui-13 text-text-hint">
                取引履歴がありません
              </p>
            ) : (
              <div className="flex flex-col gap-12">
                {transfers.map((tx) => {
                  const meLower = address?.toLowerCase() ?? "";
                  const isSent = tx.from.id.toLowerCase() === meLower;
                  const counterparty = isSent ? tx.to.id : tx.from.id;
                  const shownAmount = isSent
                    ? tx.totalAmount
                    : tx.recipientAmount;
                  const signedAmount =
                    (isSent ? -1 : 1) *
                    Number(formatUnits(BigInt(shownAmount), 18));
                  const memo =
                    parseMessagePayload(tx.message)?.memo || undefined;
                  return (
                    <ProfileListRow
                      key={tx.id}
                      address={counterparty}
                      message={memo}
                      date={formatTimestamp(tx.timestamp)}
                      amount={signedAmount}
                      onClick={() => navigate(`/transactions/${counterparty}`)}
                      className="cursor-pointer"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Osusowake */}
        <div>
          <SectionTitle
            moreLabel="もっとみる"
            onMoreClick={() => navigate("/osusowake")}
          >
            おすそわけ
          </SectionTitle>
          <div className="mt-8">
            <OsusowakeCards items={osusowakeItems} layout="scroll" />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <MainBottomNavigation />
    </div>
  );
}

export default function Home() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return <LoadingScreen />;

  return authenticated ? <AuthenticatedHome /> : <LoginScreen />;
}
