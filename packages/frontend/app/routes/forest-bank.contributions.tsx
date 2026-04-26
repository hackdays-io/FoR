import { useNavigate } from "react-router";
import { formatUnits } from "viem";

import {
  AppBar,
  AppBarBackButton,
  AppBarItem,
  AppBarTitle,
} from "~/components/ui/app-bar";
import { ListRow } from "~/components/ui/list-row";
import { Typography } from "~/components/ui/typography";
import { useRecentFundContributions } from "~/hooks/useFundContributions";
import { formatTimestamp, shortenAddress } from "~/lib/utils";
import type { Route } from "./+types/forest-bank.contributions";

const CONTRIBUTIONS_LIMIT = 200;

export function meta(_args: Route.MetaArgs) {
  return [{ title: "みんなの貢献履歴 | FoR" }];
}

export default function Contributions() {
  const navigate = useNavigate();
  const { data: contributions, isLoading } =
    useRecentFundContributions(CONTRIBUTIONS_LIMIT);

  return (
    <div className="min-h-screen bg-bg-default">
      <AppBar>
        <AppBarItem position="left">
          <AppBarBackButton onClick={() => navigate(-1)} />
        </AppBarItem>
        <AppBarItem position="center">
          <AppBarTitle>みんなの貢献履歴</AppBarTitle>
        </AppBarItem>
      </AppBar>

      <div className="flex flex-col gap-12 px-20 py-20">
        {isLoading ? (
          <Typography variant="ui-13" className="py-12 text-text-hint">
            読み込み中...
          </Typography>
        ) : !contributions || contributions.length === 0 ? (
          <Typography variant="ui-13" className="py-12 text-text-hint">
            まだ貢献がありません
          </Typography>
        ) : (
          contributions.map((t) => {
            const fundFormatted = Number(formatUnits(BigInt(t.fundAmount), 18));
            return (
              <div key={t.id} className="rounded-lg bg-muted px-16">
                <ListRow
                  name={shortenAddress(t.from.id)}
                  message={t.message ?? undefined}
                  date={formatTimestamp(t.timestamp)}
                  amount={fundFormatted}
                  divider={false}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
