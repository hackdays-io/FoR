import { GraphQLClient } from "graphql-request";
import type { TypedDocumentString } from "~/gql/graphql";
import { subgraphUrl } from "~/lib/subgraph";

/**
 * MCP から見たサブグラフ。
 *
 * アプリ本体の `subgraphUrl` は `import.meta.env`（ビルド時埋め込み）で決まるため、
 * デプロイをやり直さずに参照先を差し替えられるよう `MCP_SUBGRAPH_URL` を優先する。
 * チェーン自体（エクスプローラー URL やコントラクトアドレス）はアプリのビルドに従う。
 */
export function getMcpSubgraphUrl(): string {
  const url = process.env.MCP_SUBGRAPH_URL || subgraphUrl;
  if (!url) {
    throw new Error(
      "サブグラフの URL が設定されていません。MCP_SUBGRAPH_URL または VITE_SUBGRAPH_URL を設定してください。",
    );
  }
  return url;
}

/**
 * URL を上書きしているかどうか。
 * チェーン名・コントラクト・エクスプローラー URL はアプリのビルド設定由来なので、
 * 上書き先が別チェーンだと表示がずれる。get_index_status で明示するために使う。
 */
export function isSubgraphUrlOverridden(): boolean {
  return Boolean(process.env.MCP_SUBGRAPH_URL);
}

let cached: { url: string; client: GraphQLClient } | undefined;

function getClient(): GraphQLClient {
  const url = getMcpSubgraphUrl();
  if (!cached || cached.url !== url) {
    cached = { url, client: new GraphQLClient(url) };
  }
  return cached.client;
}

export async function querySubgraph<TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  variables: TVariables,
): Promise<TResult> {
  return getClient().request<TResult>(
    document as unknown as string,
    variables as Record<string, unknown>,
  );
}
