import { useLogin, usePrivy } from "@privy-io/react-auth";
import { Gift, QrCode, Scan, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";
import { formatUnits } from "viem";
import logoMain from "~/assets/images/logo/logo-main.png";
import logoTagline from "~/assets/images/logo/logo-tagline.png";
import { LoadingScreen } from "~/components/loading-screen";
import { OsusowakeCards } from "~/components/osusowake-cards";
import {
  AppBar,
  AppBarItem,
  AppBarLogo,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { Avatar } from "~/components/ui/avatar";
import {
  BottomNavigation,
  BottomNavigationItem,
} from "~/components/ui/bottom-navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ListRow } from "~/components/ui/list-row";
import { SectionTitle } from "~/components/ui/section-title";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useForTokenBalance } from "~/hooks/useForToken";
import { useProfileByAddress } from "~/hooks/useProfileByAddress";
import { useTransfersViaRouter } from "~/hooks/useTransfersViaRouter";
import { loadOsusowakeItems } from "~/lib/osusowake.server";
import { formatTimestamp, shortenAddress } from "~/lib/utils";
import type { Route } from "./+types/home";

export async function loader() {
  // defer: Promise のまま返してストリーミングする
  // （home 本体の描画・遷移を Google Sheets 取得でブロックしない）
  return { osusowakeItems: loadOsusowakeItems() };
}

const WALLET_INIT_TIMEOUT_MS = 5000;

function WalletErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-16 bg-bg-default px-20">
      <Typography variant="ui-13" className="text-center text-text-default">
        ウォレットの準備に時間がかかっています。
        <br />
        再度ログインしてお試しください。
      </Typography>
      <Button onClick={onRetry} className="w-full">
        再ログイン
      </Button>
    </div>
  );
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
    <div className="flex min-h-screen flex-col bg-bg-default px-20">
      {/* Logo */}
      <div className="flex flex-1 flex-col items-center justify-center gap-16">
        <img
          src={logoMain}
          alt="FoR"
          className="h-[160px] w-[160px] object-contain"
        />
        <img
          src={logoTagline}
          alt="ForForest. ForPlanet. ForUs."
          className="w-[160px] object-contain"
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

const ICON_SIZE = 20;

function TransferRow({
  counterparty,
  date,
  amount,
  onClick,
}: {
  counterparty: string;
  date: string;
  amount: number;
  onClick: () => void;
}) {
  const { data: profile } = useProfileByAddress(counterparty);
  const displayName =
    profile?.text_records?.display ||
    profile?.name ||
    shortenAddress(counterparty);

  return (
    <ListRow
      name={displayName}
      avatarSrc={profile?.text_records?.avatar}
      date={date}
      amount={amount}
      onClick={onClick}
      className="cursor-pointer"
    />
  );
}

function AuthenticatedHome() {
  const navigate = useNavigate();
  const { logout } = usePrivy();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { data: balance, isLoading: isBalanceLoading } =
    useForTokenBalance(address);
  const { data: transfers, isLoading: isTransfersLoading } =
    useTransfersViaRouter(address, 3);
  // プロフィール表示用（AuthGate と同じ react-query キャッシュを共有）
  const { data: profile } = useProfileByAddress(address);
  const [walletTimedOut, setWalletTimedOut] = useState(false);
  const { osusowakeItems } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (address) {
      setWalletTimedOut(false);
      return;
    }
    const timer = setTimeout(
      () => setWalletTimedOut(true),
      WALLET_INIT_TIMEOUT_MS,
    );
    return () => clearTimeout(timer);
  }, [address]);

  const handleRelogin = async () => {
    await logout();
    setWalletTimedOut(false);
  };

  if (!address && walletTimedOut) {
    return <WalletErrorScreen onRetry={handleRelogin} />;
  }

  if (isWalletLoading || !address) {
    return <LoadingScreen />;
  }

  const displayName = profile?.text_records?.display || profile?.name || "";

  return (
    <div className="min-h-screen bg-bg-default pb-[100px]">
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
            森の共通基金
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
              transfers.map((tx) => {
                const meLower = address?.toLowerCase() ?? "";
                const isSent = tx.from.id.toLowerCase() === meLower;
                const counterparty = isSent ? tx.to.id : tx.from.id;
                const shownAmount = isSent
                  ? tx.totalAmount
                  : tx.recipientAmount;
                const signedAmount =
                  (isSent ? -1 : 1) *
                  Number(formatUnits(BigInt(shownAmount), 18));
                return (
                  <TransferRow
                    key={tx.id}
                    counterparty={counterparty}
                    date={formatTimestamp(tx.timestamp)}
                    amount={signedAmount}
                    onClick={() => navigate(`/transactions/${counterparty}`)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Osusowake */}
        <div>
          <SectionTitle
            moreLabel="もっとみる"
            onMoreClick={() => navigate("/osusowake")}
          >
            おすそ分け
          </SectionTitle>
          <div className="mt-8">
            <OsusowakeCards items={osusowakeItems} layout="scroll" />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation>
        <BottomNavigationItem
          icon={<Send size={ICON_SIZE} />}
          label="送る"
          to="/transactions"
        />
        <BottomNavigationItem
          icon={<Scan size={ICON_SIZE} />}
          label="スキャン"
          to="/scan"
        />
        <BottomNavigationItem
          icon={<QrCode size={ICON_SIZE} />}
          label="マイコード"
          to="/receive"
        />
        <BottomNavigationItem
          icon={<Gift size={ICON_SIZE} />}
          label="おすそ分け"
          to="/osusowake"
        />
      </BottomNavigation>
    </div>
  );
}

export default function Home() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return <LoadingScreen />;

  return authenticated ? <AuthenticatedHome /> : <LoginScreen />;
}
