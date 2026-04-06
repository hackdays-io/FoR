import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { getGraphQLClient } from "~/lib/graphql";
import type { Transfer } from "./useTransfers";

const USER_QUERY = gql`
  query GetUser($id: ID!, $first: Int!) {
    user(id: $id) {
      id
      sentTransfers(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        sender { id }
        from { id }
        to { id }
        totalAmount
        fundAmount
        burnAmount
        recipientAmount
        timestamp
        transactionHash
        blockNumber
      }
      receivedTransfers(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        sender { id }
        from { id }
        to { id }
        totalAmount
        fundAmount
        burnAmount
        recipientAmount
        timestamp
        transactionHash
        blockNumber
      }
    }
  }
`;

export interface User {
  id: string;
  sentTransfers: Transfer[];
  receivedTransfers: Transfer[];
}

interface UserResponse {
  user: User | null;
}

export function useUser(address: string | undefined, first = 20) {
  return useQuery({
    queryKey: ["user", address, first],
    queryFn: () =>
      getGraphQLClient().request<UserResponse>(USER_QUERY, {
        id: address!.toLowerCase(),
        first,
      }),
    select: (data) => data.user,
    enabled: !!address,
  });
}
