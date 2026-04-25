import { useQuery } from "@tanstack/react-query";

import type { GetRecentFundContributionsQuery } from "~/gql/graphql";
import { GET_RECENT_FUND_CONTRIBUTIONS } from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

export type FundContribution =
  GetRecentFundContributionsQuery["transferViaRouters"][number];

export function useRecentFundContributions(first = 50, skip = 0) {
  return useQuery({
    queryKey: ["fundContributions", first, skip],
    queryFn: () =>
      getGraphQLClient().request<GetRecentFundContributionsQuery>(
        GET_RECENT_FUND_CONTRIBUTIONS,
        { first, skip },
      ),
    select: (data) =>
      data.transferViaRouters.filter((t) => BigInt(t.fundAmount) > 0n),
  });
}
