import { Gift, QrCode, Scan, Send } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";

import forestWalletCardBackground from "~/assets/images/cards/forest-wallet-card-background.png";
import { AppBar, AppBarItem, AppBarTitle } from "~/components/ui/app-bar";
import {
  BottomNavigation,
  BottomNavigationItem,
} from "~/components/ui/bottom-navigation";
import { Button } from "~/components/ui/button";
import { ListRow } from "~/components/ui/list-row";
import { SectionTitle } from "~/components/ui/section-title";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Typography } from "~/components/ui/typography";
import { useActiveWallet } from "~/hooks/useActiveWallet";
import { useRecentFundContributions } from "~/hooks/useFundContributions";
import { useFundWalletBalance } from "~/hooks/useFundWallet";
import { useUser } from "~/hooks/useUser";
import { formatTimestamp, shortenAddress } from "~/lib/utils";
import type { Route } from "./+types/forest-bank";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "森の共通基金 | FoR" }];
}

const RECENT_LIMIT = 50;
const SENT_TRANSFERS_LIMIT = 1000;
const ICON_SIZE = 20;

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

  const myContribution = useMemo(() => {
    if (!user?.sentTransfersViaRouter) return 0n;
    return user.sentTransfersViaRouter.reduce(
      (sum, t) => sum + BigInt(t.fundAmount),
      0n,
    );
  }, [user]);

  const balanceDisplay = balance ? balance.formatted : "—";
  const myContributionDisplay = formatUnits(myContribution, 18);
  const snapshot = formatSnapshot(new Date(dataUpdatedAt || Date.now()));

  return (
    <div className="min-h-screen bg-bg-default pb-[100px]">
      <AppBar>
        <AppBarItem position="center">
          <AppBarTitle>森の共通基金</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <Tabs defaultValue="forest" variant="underline">
        <TabsList>
          <TabsTrigger value="my-wallet" onClick={() => navigate("/")}>
            あなたのウォレット
          </TabsTrigger>
          <TabsTrigger value="forest">森の共通基金</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-24 px-20 pt-20">
        <div
          className="relative h-[214px] overflow-hidden rounded-lg bg-cover bg-center shadow-elevation-1"
          style={{ backgroundImage: `url(${forestWalletCardBackground})` }}
        >
          <div className="absolute inset-0 flex flex-col justify-between p-16 text-foreground">
            <Typography variant="ui-16" weight="bold">
              Collective Fund
            </Typography>
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-end gap-4">
                <Typography variant="ui-13" className="text-text-subtle">
                  Total
                </Typography>
                <Typography variant="number-l" weight="bold">
                  {isBalanceLoading ? "—" : balanceDisplay}
                </Typography>
                <Typography variant="ui-16" weight="bold">
                  KUU
                </Typography>
              </div>
              <div className="flex justify-end">
                <Typography variant="ui-10" className="text-text-subtle">
                  {snapshot}
                </Typography>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-background px-16">
          <ListRow
            name="あなたの貢献量"
            amount={isUserLoading ? undefined : Number(myContributionDisplay)}
            divider={false}
          />
        </div>

        <div>
          <SectionTitle
            moreLabel="もっとみる"
            onMoreClick={() => navigate("/forest-bank/contributions")}
          >
            みんなの貢献履歴
          </SectionTitle>
          <div className="mt-8">
            {isContributionsLoading ? (
              <Typography variant="ui-13" className="py-12 text-text-hint">
                読み込み中...
              </Typography>
            ) : !contributions || contributions.length === 0 ? (
              <Typography variant="ui-13" className="py-12 text-text-hint">
                まだ貢献がありません
              </Typography>
            ) : (
              contributions.map((t, i) => {
                const fundFormatted = Number(
                  formatUnits(BigInt(t.fundAmount), 18),
                );
                return (
                  <ListRow
                    key={t.id}
                    name={shortenAddress(t.from.id)}
                    message={t.message ?? undefined}
                    date={formatTimestamp(t.timestamp)}
                    amount={fundFormatted}
                    divider={i < contributions.length - 1}
                  />
                );
              })
            )}
          </div>
        </div>

        <Button variant="secondary" className="w-full" disabled>
          森の共通基金とは？
        </Button>
      </div>

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
