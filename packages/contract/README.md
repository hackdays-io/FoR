# FoR Contract

FoR のスマートコントラクトパッケージです（Hardhat v3 / Ignition）。

## 必要な環境変数

Sepolia へデプロイする場合のみ、実行時に以下を設定します。

- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`（`0x` + 64桁hex）

## 開発コマンド

```bash
pnpm --filter @for/contract build
pnpm --filter @for/contract test
pnpm --filter @for/contract dev
```

## デプロイコマンド

```bash
pnpm --filter @for/contract deploy:local:FoRToken
pnpm --filter @for/contract deploy:local:RouterFactory
pnpm --filter @for/contract deploy:local:Router
pnpm --filter @for/contract deploy:sepolia:FoRToken
pnpm --filter @for/contract deploy:sepolia:RouterFactory
pnpm --filter @for/contract deploy:sepolia:Router
```

## Sepolia への推奨手順

`Router` モジュール実行で依存する `FoRToken` / `RouterFactory` も一緒に処理されます。

```bash
export SEPOLIA_RPC_URL="..."
export SEPOLIA_PRIVATE_KEY="0x..."
pnpm --filter @for/contract deploy:sepolia:Router
```

過去の Ignition state と不整合がある場合は `--reset` を使います。

```bash
pnpm --filter @for/contract exec hardhat ignition deploy \
  ignition/modules/Router.ts \
  --network sepolia \
  --parameters ignition/parameters.sepolia.json \
  --reset
```

## デプロイ結果の確認

成果物:

- `packages/contract/ignition/deployments/chain-11155111/deployed_addresses.json`
- `packages/contract/ignition/deployments/chain-11155111/journal.jsonl`

参照方法:

- `deployed_addresses.json`: `FoRToken` / `RouterFactory` のアドレス
- `journal.jsonl`: `RouterModule#RouterFactoryModule~RouterFactory.deploy` の `TRANSACTION_CONFIRM` から `Router` の実アドレスと `blockNumber`（=`startBlock`）

`Router address` と `startBlock` は `packages/indexer/config/sepolia.json` に反映して、indexer 側デプロイで利用します。
