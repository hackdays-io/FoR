import { useMemo } from "react";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";

import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { ListRow } from "~/components/ui/list-row";
import { SectionTitle } from "~/components/ui/section-title";
import { Typography } from "~/components/ui/typography";
import { useRecentFundContributions } from "~/hooks/useFundContributions";
import { useFundWallet, useFundWalletBalance } from "~/hooks/useFundWallet";
import { formatTimestamp, shortenAddress } from "~/lib/utils";
import type { Route } from "./+types/forest-bank";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "森の貯金箱 | FoR" }];
}

const RECENT_LIMIT = 50;

export default function ForestBank() {
  const navigate = useNavigate();
  const { data: fundWallet } = useFundWallet();
  const { data: balance, isLoading: isBalanceLoading } = useFundWalletBalance();
  const { data: contributions, isLoading: isContributionsLoading } =
    useRecentFundContributions(RECENT_LIMIT);

  // 直近 RECENT_LIMIT 件の合計（全期間ではない目安値）
  const recentTotal = useMemo(() => {
    if (!contributions) return 0n;
    return contributions.reduce((sum, t) => sum + BigInt(t.fundAmount), 0n);
  }, [contributions]);

  const balanceDisplay = balance ? balance.formatted : "—";
  const recentTotalDisplay = formatUnits(recentTotal, 18);

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>森の貯金箱</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-col gap-24 px-20 py-24">
        {/* 現在残高カード */}
        <div className="flex flex-col gap-8 rounded-lg bg-background p-16">
          <Typography variant="ui-13" className="text-text-subtle">
            現在の残高
          </Typography>
          <div className="flex items-baseline gap-4">
            <Typography variant="number-l" weight="bold">
              {isBalanceLoading ? "…" : balanceDisplay}
            </Typography>
            <Typography variant="ui-16" weight="bold">
              FoR
            </Typography>
          </div>
          {fundWallet ? (
            <Typography variant="ui-10" className="text-text-hint">
              基金ウォレット: {shortenAddress(fundWallet)}
            </Typography>
          ) : null}
        </div>

        {/* 直近の合計（参考値） */}
        <div className="flex flex-col gap-8 rounded-lg bg-background p-16">
          <Typography variant="ui-13" className="text-text-subtle">
            直近 {RECENT_LIMIT} 件の貢献の合計
          </Typography>
          <div className="flex items-baseline gap-4">
            <Typography variant="number-m" weight="bold">
              {isContributionsLoading ? "…" : recentTotalDisplay}
            </Typography>
            <Typography variant="ui-16" weight="bold">
              FoR
            </Typography>
          </div>
          <Typography variant="ui-10" className="text-text-hint">
            ※
            全期間の累計ではありません。総累計は今後集計指標として追加予定です。
          </Typography>
        </div>

        {/* 直近の貢献一覧 */}
        <div>
          <SectionTitle>直近の貢献</SectionTitle>
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
                    date={formatTimestamp(t.timestamp)}
                    amount={fundFormatted}
                    divider={i < contributions.length - 1}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
