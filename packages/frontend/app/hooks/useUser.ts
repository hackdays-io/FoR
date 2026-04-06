import { useQuery } from "@tanstack/react-query";
import type { GetUserQuery } from "~/gql/graphql";
import { GET_USER } from "~/graphql/queries";
import { getGraphQLClient } from "~/lib/graphql";

export type User = NonNullable<GetUserQuery["user"]>;

export function useUser(address: string | undefined, first = 20) {
	return useQuery({
		queryKey: ["user", address, first],
		queryFn: () =>
			getGraphQLClient().request<GetUserQuery>(GET_USER, {
				id: address!.toLowerCase(),
				first,
			}),
		select: (data) => data.user,
		enabled: !!address,
	});
}
