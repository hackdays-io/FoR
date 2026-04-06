import { GraphQLClient } from "graphql-request";
import { subgraphUrl } from "./subgraph";

export function getGraphQLClient(): GraphQLClient {
  if (!subgraphUrl) {
    throw new Error(
      "Subgraph URL is not configured. Set VITE_SUBGRAPH_URL or use a supported chain.",
    );
  }
  return new GraphQLClient(subgraphUrl);
}
