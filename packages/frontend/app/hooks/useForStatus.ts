import { useMemo } from "react";
import { OrderDirection } from "~/gql/graphql";
import { useTransfersViaRouter } from "~/hooks/useTransfersViaRouter";
import { computeForStatus, type ForStatus } from "~/lib/for-status";

// ランク再構成に必要な決済履歴の取得上限（送信のみを対象に十分な件数を取得する）。
const HISTORY_FETCH_LIMIT = 1000;

export type UseForStatusResult = {
  status: ForStatus | null;
  isLoading: boolean;
};

/**
 * 指定アドレスの FoR Status を算出する。
 *
 * 決済 = 送信のみ（`from === me`）として `transferViaRouters` を抽出し、
 * 決済履歴と現在時刻から純粋関数でティアを再構成する。
 */
export function useForStatus(
  address: string | null | undefined,
): UseForStatusResult {
  const { data: transfers, isLoading } = useTransfersViaRouter(
    address,
    HISTORY_FETCH_LIMIT,
    0,
    OrderDirection.Asc,
  );

  const status = useMemo<ForStatus | null>(() => {
    if (!address || !transfers) return null;
    const me = address.toLowerCase();
    // 決済 = 送信のみ。subgraph の timestamp は unix 秒なので ms に変換する。
    const paymentTimestampsMs = transfers
      .filter((tx) => tx.from.id.toLowerCase() === me)
      .map((tx) => Number(tx.timestamp) * 1000);

    return computeForStatus({ paymentTimestampsMs, nowMs: Date.now() });
  }, [address, transfers]);

  return { status, isLoading };
}
