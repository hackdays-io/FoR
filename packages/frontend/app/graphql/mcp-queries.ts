import { graphql } from "~/gql";

/**
 * MCP サーバー専用のサブグラフクエリ。
 *
 * アプリ画面用（queries.ts）と違い `where` を変数として受け取る形にしてある。
 * 新着ポーリング・最新一覧・アカウント別履歴・tx ハッシュ検索がすべて
 * 同じドキュメントで賄えるため、codegen の生成物とテスト対象を小さく保てる。
 */
export const MCP_GET_TRANSFERS = graphql(`
  query McpGetTransfers(
    $where: TransferViaRouter_filter
    $first: Int!
    $skip: Int!
    $orderDirection: OrderDirection!
  ) {
    transferViaRouters(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: $orderDirection
      where: $where
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
      message
      timestamp
      blockNumber
      transactionHash
      logIndex
    }
  }
`);

/**
 * インデックスの鮮度と現在の分配比率。
 * エージェントが「このデータはいつ時点のものか」を判断するために使う。
 */
export const MCP_GET_INDEX_STATUS = graphql(`
  query McpGetIndexStatus {
    _meta {
      block {
        number
        timestamp
      }
      hasIndexingErrors
    }
    distributionRatios(first: 1, orderBy: timestamp, orderDirection: desc) {
      id
      fundRatio
      burnRatio
      recipientRatio
      timestamp
      blockNumber
      transactionHash
    }
  }
`);

/** アカウント要約用。累計の税額は User エンティティ側にしか無い */
export const MCP_GET_ACCOUNT = graphql(`
  query McpGetAccount($id: ID!) {
    user(id: $id) {
      id
      totalTaxPaid
      totalFundTaxPaid
      totalBurnTaxPaid
    }
  }
`);
