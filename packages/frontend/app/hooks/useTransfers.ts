import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { getGraphQLClient } from "~/lib/graphql";

const TRANSFERS_QUERY = gql`
  query GetTransfers($first: Int!, $skip: Int!, $orderDirection: String!) {
    transfers(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: $orderDirection
    ) {
      id
      sender {
        id
      }
      from {
        id
      }
      to {
        id
      }
      totalAmount
      fundAmount
      burnAmount
      recipientAmount
      timestamp
      transactionHash
      blockNumber
    }
  }
`;

export interface Transfer {
  id: string;
  sender: { id: string };
  from: { id: string };
  to: { id: string };
  totalAmount: string;
  fundAmount: string;
  burnAmount: string;
  recipientAmount: string;
  timestamp: string;
  transactionHash: string;
  blockNumber: string;
}

interface TransfersResponse {
  transfers: Transfer[];
}

export function useTransfers(
  first = 20,
  skip = 0,
  orderDirection: "asc" | "desc" = "desc",
) {
  return useQuery({
    queryKey: ["transfers", first, skip, orderDirection],
    queryFn: () =>
      getGraphQLClient().request<TransfersResponse>(TRANSFERS_QUERY, {
        first,
        skip,
        orderDirection,
      }),
    select: (data) => data.transfers,
  });
}
