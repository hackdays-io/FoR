import { useQuery } from "@tanstack/react-query";
import type { GetTransfersBetweenQuery } from "~/gql/graphql";
import { GET_TRANSFERS_BETWEEN } from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

export type TransferBetween =
	GetTransfersBetweenQuery["transferViaRouters"][number];

export function useTransfersBetween(
	me: string | null | undefined,
	peer: string | null | undefined,
	first = 100,
) {
	return useQuery({
		queryKey: ["transfersBetween", me, peer, first],
		queryFn: () => {
			const meLower = me!.toLowerCase();
			const peerLower = peer!.toLowerCase();
			return getGraphQLClient().request<GetTransfersBetweenQuery>(
				GET_TRANSFERS_BETWEEN,
				{ me: meLower, peer: peerLower, first },
			);
		},
		select: (data) => data.transferViaRouters,
		enabled: !!me && !!peer,
	});
}
