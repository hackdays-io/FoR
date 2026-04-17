import { useQuery } from "@tanstack/react-query";
import type { GetTransfersViaRouterQuery } from "~/gql/graphql";
import { OrderDirection } from "~/gql/graphql";
import { GET_TRANSFERS_VIA_ROUTER } from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

export type TransferViaRouter =
	GetTransfersViaRouterQuery["transferViaRouters"][number];

export function useTransfersViaRouter(
	first = 20,
	skip = 0,
	orderDirection: OrderDirection = OrderDirection.Desc,
) {
	return useQuery({
		queryKey: ["transferViaRouters", first, skip, orderDirection],
		queryFn: () =>
			getGraphQLClient().request<GetTransfersViaRouterQuery>(
				GET_TRANSFERS_VIA_ROUTER,
				{
					first,
					skip,
					orderDirection,
				},
			),
		select: (data) => data.transferViaRouters,
	});
}
