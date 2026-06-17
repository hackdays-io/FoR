import { useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { formatUnits } from "viem";

import { MainBottomNavigation } from "~/components/main-bottom-navigation";
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
import { ListRow } from "~/components/ui/list-row";
import { SectionTitle } from "~/components/ui/section-title";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useRecentFundContributions } from "~/hooks/useFundContributions";
import { useFundWalletBalance } from "~/hooks/useFundWallet";
import { useProfileByAddress } from "~/hooks/useProfileByAddress";
import { useUser } from "~/hooks/useUser";
import { parseMessagePayload } from "~/lib/transfer-message";
import { formatTimestamp } from "~/lib/utils";
import type { Route } from "./+types/forest-bank";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "森の再生基金 | FoR" }];
}

const RECENT_LIMIT = 50;
const RECENT_DISPLAY_LIMIT = 3;
const SENT_TRANSFERS_LIMIT = 1000;

function formatSnapshot(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}:${ss}`;
}

export default function ForestBank() {
  const navigate = useNavigate();
  const { address } = useActiveWallet();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    dataUpdatedAt,
  } = useFundWalletBalance();
  const { data: user, isLoading: isUserLoading } = useUser(
    address ?? undefined,
    SENT_TRANSFERS_LIMIT,
  );
  const { data: contributions, isLoading: isContributionsLoading } =
    useRecentFundContributions(RECENT_LIMIT);
  const { data: profile } = useProfileByAddress(address);
  const displayName = profile?.text_records?.display || profile?.name || "";

  const myContribution = useMemo(() => {
    if (!user?.sentTransfersViaRouter) return 0n;
    return user.sentTransfersViaRouter.reduce(
      (sum, t) => sum + BigInt(t.fundAmount),
      0n,
    );
  }, [user]);

  const myContributionDisplay = formatUnits(myContribution, 18);
  const snapshot = formatSnapshot(new Date(dataUpdatedAt || Date.now()));
  const recentContributions = contributions?.slice(0, RECENT_DISPLAY_LIMIT);

  return (
    <div className="min-h-dvh bg-bg-default pb-[160px]">
      <AppBar>
        <AppBarItem position="left">
          <AppBarLogo />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>森の再生基金</AppBarTitle>
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

      <Tabs defaultValue="forest" variant="underline">
        <TabsList>
          <TabsTrigger value="my-wallet" onClick={() => navigate("/")}>
            あなたのウォレット
          </TabsTrigger>
          <TabsTrigger value="forest">森の再生基金</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-24 px-20 pt-20">
        {/* Collective Fund Card */}
        <div className="flex flex-col gap-8">
          <Card
            variant="fund"
            amount={isBalanceLoading || !balance ? "--" : balance.formatted}
          />
          <Typography variant="ui-10" className="text-right text-text-hint">
            {snapshot}
          </Typography>
        </div>

        <ListRow
          name="あなたの貢献量"
          hideAvatar
          amount={isUserLoading ? undefined : Number(myContributionDisplay)}
          className="bg-white p-16 border border-black/10"
        />

        <div>
          <SectionTitle
            moreLabel="もっとみる"
            onMoreClick={() => navigate("/forest-bank/contributions")}
          >
            みんなの貢献履歴
          </SectionTitle>
          <div className="mt-8">
            {isContributionsLoading ? null : !recentContributions ||
              recentContributions.length === 0 ? (
              <Typography variant="ui-13" className="py-12 text-text-hint">
                まだ貢献がありません
              </Typography>
            ) : (
              <div className="flex flex-col gap-12">
                {recentContributions.map((t) => {
                  const memo =
                    parseMessagePayload(t.message)?.memo || undefined;
                  return (
                    <ProfileListRow
                      key={t.id}
                      address={t.from.id}
                      message={memo}
                      date={formatTimestamp(t.timestamp)}
                      amount={Number(formatUnits(BigInt(t.fundAmount), 18))}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => navigate("/forest-bank/about")}
        >
          森の再生基金とは？
        </Button>
      </div>

      <MainBottomNavigation />
    </div>
  );
}
