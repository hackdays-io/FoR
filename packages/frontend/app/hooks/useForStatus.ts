import { useMemo } from "react";
import { useSentPayments } from "~/hooks/useSentPayments";
import { computeForStatus, type ForStatus } from "~/lib/for-status";

export type UseForStatusResult = {
  status: ForStatus | null;
  isLoading: boolean;
};

/**
 * 送金直後に「まだ subgraph に取り込まれていない決済」を楽観的に反映するための入力。
 * 取得済み履歴に同一 transactionHash が含まれていれば無視するため、二重計上は起きない。
 */
export type OptimisticPayment = {
  transactionHash: string;
  timestampMs: number;
};

/**
 * 指定アドレスの FoR Status を算出する。
 *
 * 決済 = 送信のみ（`from === me`）。送信履歴を全件取得し、決済履歴と現在時刻から
 * 純粋関数でティアを再構成する。`optimistic` を渡すと、subgraph 反映前の送金を
 * 即時反映する（同一 tx が取得済みなら無視）。
 */
export function useForStatus(
  address: string | null | undefined,
  optimistic?: OptimisticPayment | null,
): UseForStatusResult {
  const { data: payments, isLoading } = useSentPayments(address);

  const status = useMemo<ForStatus | null>(() => {
    if (!address || !payments) return null;

    const timestamps = payments.map((p) => p.timestampMs);

    // 楽観的反映: 取得済み履歴に同一 tx が無いときだけ追加（インデックス済みなら二重計上を避ける）。
    if (optimistic) {
      const txHash = optimistic.transactionHash.toLowerCase();
      const alreadyIndexed = payments.some(
        (p) => p.transactionHash.toLowerCase() === txHash,
      );
      if (!alreadyIndexed) timestamps.push(optimistic.timestampMs);
    }

    return computeForStatus({
      paymentTimestampsMs: timestamps,
      nowMs: Date.now(),
    });
  }, [address, payments, optimistic]);

  return { status, isLoading };
}
