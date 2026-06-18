import { useQuery } from "@tanstack/react-query";
import type { GetMySentPaymentsQuery } from "~/gql/graphql";
import { GET_MY_SENT_PAYMENTS } from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

// subgraph の 1 リクエストあたり取得上限。これを超える件数は skip でページングして全件取得する。
const PAGE_SIZE = 1000;
// 暴走防止の安全弁（PAGE_SIZE × この回数 まで取得）。
const MAX_PAGES = 50;

export type SentPayment = {
  /** 決済時刻（ms）。subgraph の timestamp は unix 秒なので ms に変換済み */
  timestampMs: number;
  /** トランザクションハッシュ（楽観的反映の二重計上防止に使う） */
  transactionHash: string;
};

/**
 * 指定アドレスが送信者（from === me）となった決済を、古い順に全件取得する。
 *
 * ランク再構成は「初回からの全履歴を時系列で再生」する必要があるため、
 * 直近だけでなく全期間を取得する。subgraph の取得上限を超える場合は
 * skip でページングして繋ぐ。
 */
export function useSentPayments(address: string | null | undefined) {
  return useQuery({
    queryKey: ["mySentPayments", address],
    enabled: !!address,
    queryFn: async (): Promise<SentPayment[]> => {
      if (!address) return [];
      const me = address.toLowerCase();
      const client = getGraphQLClient();
      const payments: SentPayment[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = await client.request<GetMySentPaymentsQuery>(
          GET_MY_SENT_PAYMENTS,
          { me, first: PAGE_SIZE, skip: page * PAGE_SIZE },
        );
        const rows = data.transferViaRouters;
        for (const tx of rows) {
          payments.push({
            timestampMs: Number(tx.timestamp) * 1000,
            transactionHash: tx.transactionHash,
          });
        }
        if (rows.length < PAGE_SIZE) break;
      }
      return payments;
    },
  });
}
