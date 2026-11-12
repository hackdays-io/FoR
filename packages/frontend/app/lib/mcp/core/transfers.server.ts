import type {
  McpGetTransfersQuery,
  TransferViaRouter_Filter,
} from "~/gql/graphql";
import { OrderDirection } from "~/gql/graphql";
import { MCP_GET_TRANSFERS } from "~/graphql/mcp-queries";
import { type RawTransfer, type TransferView, toTransferView } from "./present";
import { makeResolver, resolveProfiles } from "./profiles.server";
import { querySubgraph } from "./subgraph.server";

export type SubgraphTransfer =
  McpGetTransfersQuery["transferViaRouters"][number];

export async function fetchTransfers(params: {
  where?: TransferViaRouter_Filter;
  first: number;
  skip?: number;
  orderDirection?: OrderDirection;
}): Promise<SubgraphTransfer[]> {
  const result = await querySubgraph(MCP_GET_TRANSFERS, {
    where: params.where ?? {},
    first: params.first,
    skip: params.skip ?? 0,
    orderDirection: params.orderDirection ?? OrderDirection.Desc,
  });
  return result.transferViaRouters;
}

/** サブグラフの生データに ENS プロフィールを載せる */
export async function enrichTransfers(
  transfers: SubgraphTransfer[],
): Promise<TransferView[]> {
  const addresses = transfers.flatMap((t) => [t.from.id, t.to.id]);
  const resolver = makeResolver(await resolveProfiles(addresses));
  return transfers.map((t) => toTransferView(t as RawTransfer, resolver));
}
