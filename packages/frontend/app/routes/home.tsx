import { useLogin, usePrivy } from "@privy-io/react-auth";
import { Gift, QrCode, Scan, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useFetcher } from "react-router";
import { formatUnits } from "viem";
import { AppBar, AppBarItem, AppBarTitle } from "~/components/ui/app-bar";
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
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useForTokenBalance } from "~/hooks/useForToken";
import { useTransfers } from "~/hooks/useTransfers";
import type { NameStoneProfile } from "~/lib/namestone.server";
import type { Route } from "./+types/home";

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
  const [agreed, setAgreed] = useState(false);

  const { login } = useLogin();

  return (
    <div className="flex min-h-screen flex-col bg-bg-default px-20">
      {/* Logo */}
      <div className="flex flex-1 items-center justify-center">
        {/* Logo placeholder */}
        <div className="h-[160px] w-[160px]" />
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-16 pb-40">
        {/* Links */}
        <div className="flex items-center gap-12 text-ui-13 text-text-default">
          <Link to="/terms" className="underline underline-offset-2">
            利用規約
          </Link>
          <span className="text-text-hint">|</span>
          <Link to="/privacy" className="underline underline-offset-2">
            プライバシーポリシー
          </Link>
        </div>

        {/* Checkbox */}
        <label className="flex cursor-pointer items-center gap-8 text-ui-13 text-text-default">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="size-20 cursor-pointer rounded accent-button-primary-frame"
          />
          上記に同意する
        </label>

        {/* Button */}
        <Button disabled={!agreed} onClick={() => login()} className="w-full">
          はじめる
        </Button>
      </div>
    </div>
  );
}

const ICON_SIZE = 20;

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function formatTimestamp(timestamp: string): string {
  const date = new Date(Number(timestamp) * 1000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = DAY_NAMES[date.getDay()];
  return `${month}/${String(day).padStart(2, "0")} (${dayName})`;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Dummy data for osusowake
const dummyOsusowake = [
  { title: "森のお茶会森のお茶会最大何文字はいるで...", amount: 500, isNew: true },
  { title: "森のお茶会森のお茶会最大何文字はいるで...", amount: 500, isNew: true },
  { title: "森のお茶会森のお茶会最大何文字はいるで...", amount: 500, isNew: true },
];

function AuthenticatedHome() {
  const navigate = useNavigate();
  const { address, isLoading: isWalletLoading } = useActiveWallet();
  const { data: balance, isLoading: isBalanceLoading } = useForTokenBalance(address);
  const { data: transfers, isLoading: isTransfersLoading } = useTransfers(3);
  const fetcher = useFetcher<{ profile: NameStoneProfile | null }>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (address && !checked && fetcher.state === "idle") {
      setChecked(true);
      fetcher.load(`/api/profile/${address}`);
    }
  }, [address, checked, fetcher.state]);

  useEffect(() => {
    if (fetcher.data && !fetcher.data.profile) {
      navigate("/profile/create");
    }
  }, [fetcher.data, navigate]);

  if (isWalletLoading || !address || !checked || fetcher.state === "loading" || !fetcher.data) {
    return null;
  }

  const profile = fetcher.data.profile;
  const displayName =
    profile?.text_records?.display || profile?.name || "";

  return (
    <div className="min-h-screen bg-bg-default pb-[100px]">
      {/* Header */}
      <AppBar>
        <AppBarItem position="left">
          <Link to="/mypage">
            <Avatar
              src={profile?.text_records?.avatar}
              alt={displayName}
              size="sm"
            />
          </Link>
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>{displayName}</AppBarTitle>
        </AppBarItem>
      </AppBar>

      {/* Tabs */}
      <Tabs defaultValue="my-wallet" variant="underline">
        <TabsList>
          <TabsTrigger value="my-wallet">自分のウォレット</TabsTrigger>
          <TabsTrigger
            value="forest-wallet"
            onClick={() => navigate("/forest-bank")}
          >
            森のウォレット
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="flex flex-col gap-24 px-20 pt-20">
        {/* Wallet Card */}
        <Card
          variant="wallet"
          amount={isBalanceLoading ? "--" : balance ? Number(balance.formatted) : 0}
          topProps={{
            badgeImage: "",
          }}
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
            {isTransfersLoading ? (
              <p className="py-12 text-center text-ui-13 text-text-hint">読み込み中...</p>
            ) : !transfers || transfers.length === 0 ? (
              <p className="py-12 text-center text-ui-13 text-text-hint">取引履歴がありません</p>
            ) : (
              transfers.map((tx, i) => (
                <ListRow
                  key={tx.id}
                  name={shortenAddress(tx.from.id)}
                  date={formatTimestamp(tx.timestamp)}
                  amount={Number(formatUnits(BigInt(tx.totalAmount), 18))}
                  divider={i < transfers.length - 1}
                  onClick={() => navigate(`/transactions/${tx.transactionHash}`)}
                  className="cursor-pointer"
                />
              ))
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
          <div className="mt-8 flex gap-12 overflow-x-auto pb-8">
            {dummyOsusowake.map((item, i) => (
              <div key={i} className="w-[200px] shrink-0">
                <Card
                  variant="promo"
                  amount={item.amount}
                  topProps={{ title: item.title }}
                  isNew={item.isNew}
                  to={`/osusowake/${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation>
        <BottomNavigationItem
          icon={<Send size={ICON_SIZE} />}
          label="送る"
          to="/send"
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

  if (!ready) return null;

  return authenticated ? <AuthenticatedHome /> : <LoginScreen />;
}
