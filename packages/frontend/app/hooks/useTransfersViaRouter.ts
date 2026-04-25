import { useQuery } from "@tanstack/react-query";
import type { GetMyTransfersViaRouterQuery } from "~/gql/graphql";
import { OrderDirection } from "~/gql/graphql";
import { GET_MY_TRANSFERS_VIA_ROUTER } from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

export type TransferViaRouter =
	GetMyTransfersViaRouterQuery["transferViaRouters"][number];

export function useTransfersViaRouter(
	address: string | null | undefined,
	first = 20,
	skip = 0,
	orderDirection: OrderDirection = OrderDirection.Desc,
) {
	return useQuery({
		queryKey: ["myTransferViaRouters", address, first, skip, orderDirection],
		queryFn: () =>
			getGraphQLClient().request<GetMyTransfersViaRouterQuery>(
				GET_MY_TRANSFERS_VIA_ROUTER,
				{
					me: address!.toLowerCase(),
					first,
					skip,
					orderDirection,
				},
			),
		select: (data) => data.transferViaRouters,
		enabled: !!address,
	});
}
