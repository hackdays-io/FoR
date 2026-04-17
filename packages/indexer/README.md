# FoR Indexer (Goldsky)

FoR Router のイベントを Goldsky でインデックスするサブグラフです。

`subgraph.template.yaml` を共通テンプレートとして使い、
`config/sepolia.json` / `config/base.json` から
`subgraph.sepolia.yaml` / `subgraph.base.yaml` を生成します。

## 対象イベント

- `TransferWithDistribution`
- `DistributionRatioUpdated`

## セットアップ

```bash
pnpm install
```

## Goldsky CLI

インストール:

```bash
curl https://goldsky.com | sh
```

ログイン:

```bash
goldsky login
```

## 事前準備

1. `packages/contract` で対象チェーンにコントラクトをデプロイ
2. デプロイ結果から Router の `address` と `startBlock` を取得
3. `packages/indexer/config/<network>.json` の `address` / `startBlock` を更新

## デプロイ手順

### Sepolia

```bash
pnpm --filter @for/indexer build:sepolia
pnpm --filter @for/indexer deploy:sepolia
```

### Base

```bash
pnpm --filter @for/indexer build:base
pnpm --filter @for/indexer deploy:base
```

補足:
- `deploy:*` は内部で `build:*` を実行します。
- `for-<chain>/<version>` が既に存在すると `already exists` エラーになります。
- 再デプロイする場合は `package.json` のデプロイスクリプトと、参照側（`packages/frontend/app/lib/subgraph.ts` や `.env.example`、本README の公開エンドポイント）のバージョンを揃えて上げてください。

## 公開エンドポイント

- Sepolia: `https://api.goldsky.com/api/public/project_cm5nv64onnxxz01wf8smdgk1e/subgraphs/for-sepolia/0.0.0/gn`
- Base: `<set-after-deploy>`
