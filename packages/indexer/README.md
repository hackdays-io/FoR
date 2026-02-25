# FoR Indexer (Goldsky)

FoR Router のイベントを Goldsky でインデックスするサブグラフです。

`subgraph.template.yaml` を共通テンプレートとして使い、
`config/sepolia.json` と `config/base.json` から
`subgraph.sepolia.yaml` / `subgraph.base.yaml` を生成します。

## 対象イベント

- `TransferWithDistribution`
- `DistributionRatioUpdated`

## セットアップ

```bash
pnpm install
cp .env.example .env
```

`.env` に以下を設定してください。

- `GOLDSKY_API_KEY`
- `SEPOLIA_RPC_URL`
- `ROUTER_ADDRESS_SEPOLIA`
- `START_BLOCK_SEPOLIA`
- `BASE_RPC_URL`
- `ROUTER_ADDRESS_BASE`
- `START_BLOCK_BASE`
- `GOLDSKY_GRAPHQL_ENDPOINT`（クエリ検証時）

## ローカル開発

1. `config/sepolia.json` の `address` と `startBlock` をローカルRouter値に更新
2. Hardhat ノードを起動

```bash
pnpm --filter contract dev
```

3. 別ターミナルでコントラクトをデプロイし、Router を操作してイベントを発火
4. codegen/build を実行

```bash
pnpm --filter @for/indexer codegen:local
pnpm --filter @for/indexer build:local
```

5. Goldsky にローカル向けデプロイ

```bash
pnpm --filter @for/indexer deploy:local
```

## Sepolia デプロイ

1. `config/sepolia.json` の `address` と `startBlock` を更新
2. デプロイ

```bash
pnpm --filter @for/indexer codegen:sepolia
pnpm --filter @for/indexer build:sepolia
pnpm --filter @for/indexer deploy:sepolia
```

3. 取得した GraphQL endpoint を `GOLDSKY_GRAPHQL_ENDPOINT` に設定
4. サンプルクエリ実行

```bash
pnpm --filter @for/indexer query:sample
```

## Base デプロイ

1. `config/base.json` の `address` と `startBlock` を更新
2. Base 用 manifest をビルド

```bash
pnpm --filter @for/indexer codegen:base
pnpm --filter @for/indexer build:base
```

3. デプロイ

```bash
pnpm --filter @for/indexer deploy:base
```

4. 取得した GraphQL endpoint を `GOLDSKY_GRAPHQL_ENDPOINT` に設定
5. サンプルクエリ実行

```bash
pnpm --filter @for/indexer query:sample
```

## サンプルクエリ

### 最新の送金履歴

```graphql
query LatestTransfers {
  transfers(first: 20, orderBy: timestamp, orderDirection: desc) {
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
  }
}
```

### ユーザー単位の送金履歴

```graphql
query TransfersByUser($address: ID!) {
  user(id: $address) {
    sentTransfers(first: 20, orderBy: timestamp, orderDirection: desc) {
      id
      to { id }
      totalAmount
      timestamp
    }
    receivedTransfers(first: 20, orderBy: timestamp, orderDirection: desc) {
      id
      from { id }
      totalAmount
      timestamp
    }
  }
}
```

### 比率変更履歴と最新値

```graphql
query RatioHistory {
  distributionRatios(first: 20, orderBy: timestamp, orderDirection: desc) {
    id
    changedBy { id }
    fundRatio
    burnRatio
    recipientRatio
    timestamp
    transactionHash
  }
}
```

```graphql
query LatestRatio {
  distributionRatios(first: 1, orderBy: timestamp, orderDirection: desc) {
    id
    fundRatio
    burnRatio
    recipientRatio
    changedBy { id }
    timestamp
  }
}
```

## 公開エンドポイント

- Sepolia: `<set-after-deploy>`
- Base: `<set-after-deploy>`

## Manifest 生成

チェーン設定を変更したら、先に manifest を再生成してください。

```bash
pnpm --filter @for/indexer generate:manifests
```
