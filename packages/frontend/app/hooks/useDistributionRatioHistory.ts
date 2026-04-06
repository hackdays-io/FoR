import { useQuery } from "@tanstack/react-query";
import type {
	GetCurrentDistributionRatioQuery,
	GetDistributionRatioHistoryQuery,
} from "~/gql/graphql";
import {
	GET_CURRENT_DISTRIBUTION_RATIO,
	GET_DISTRIBUTION_RATIO_HISTORY,
} from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

export type DistributionRatioRecord =
	GetDistributionRatioHistoryQuery["distributionRatios"][number];

export function useCurrentDistributionRatio() {
	return useQuery({
		queryKey: ["distributionRatio", "current"],
		queryFn: () =>
			getGraphQLClient().request<GetCurrentDistributionRatioQuery>(
				GET_CURRENT_DISTRIBUTION_RATIO,
			),
		select: (data) => {
			const ratio = data.distributionRatios[0];
			if (!ratio) return null;
			return {
				fundRatio: BigInt(ratio.fundRatio),
				burnRatio: BigInt(ratio.burnRatio),
				recipientRatio: BigInt(ratio.recipientRatio),
				timestamp: ratio.timestamp,
				changedBy: ratio.changedBy.id,
			};
		},
	});
}

export function useDistributionRatioHistory(first = 20, skip = 0) {
	return useQuery({
		queryKey: ["distributionRatio", "history", first, skip],
		queryFn: () =>
			getGraphQLClient().request<GetDistributionRatioHistoryQuery>(
				GET_DISTRIBUTION_RATIO_HISTORY,
				{ first, skip },
			),
		select: (data) => data.distributionRatios,
	});
}
