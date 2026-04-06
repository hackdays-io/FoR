import { useQuery } from "@tanstack/react-query";
import type { GetTransfersQuery } from "~/gql/graphql";
import { OrderDirection } from "~/gql/graphql";
import { GET_TRANSFERS } from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

export type Transfer = GetTransfersQuery["transfers"][number];

export function useTransfers(
	first = 20,
	skip = 0,
	orderDirection: OrderDirection = OrderDirection.Desc,
) {
	return useQuery({
		queryKey: ["transfers", first, skip, orderDirection],
		queryFn: () =>
			getGraphQLClient().request<GetTransfersQuery>(GET_TRANSFERS, {
				first,
				skip,
				orderDirection,
			}),
		select: (data) => data.transfers,
	});
}
