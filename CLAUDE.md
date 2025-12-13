# FoR - Distribution Transfer System

FORトークンの分配送金システム。送金時に自動的に基金・Burn・受取人へトークンを分配します。

## プロジェクト構成

```
FoR/
├── packages/
│   ├── contract/          # スマートコントラクト (Hardhat)
│   └── frontend/          # Webアプリケーション (React Router)
└── pnpm-workspace.yaml
```

## 技術スタック

### スマートコントラクト
- **Hardhat v3**: Ethereum開発環境
- **Viem**: Ethereumインタラクション
- **TypeScript**: 型安全な開発

### フロントエンド
- **React Router v7**: フルスタックReactフレームワーク
- **React 19**: UIライブラリ
- **Tailwind CSS v4**: スタイリング
- **Vite**: ビルドツール
- **TypeScript**: 型安全な開発

## コア機能

### 1. FORトークン
- ERC20標準準拠
- ERC2612 (permit) サポート
- オフチェーン署名による承認

### 2. Routerコントラクト
**ユーザー間送金の分配:**
- 受取人への送金
- 基金ウォレットへの自動分配
- Burnアドレスへの焼却
- 設定可能な分配比率

**商品購入時の送金:**
- FORのロック機能（キャンセル期間）
- ロック期間経過後の分配実行
- 運営者による引き出し制御

## 開発コマンド

### モノレポ全体
```bash
# 依存関係のインストール
pnpm install

# 全パッケージのビルド
pnpm build

# 全パッケージの開発サーバー起動
pnpm dev

# テスト実行
pnpm test
```

### コントラクト (packages/contract/)
```bash
cd packages/contract

# コンパイル
pnpm build

# テスト
pnpm test

# デプロイ（実装予定）
pnpm deploy
```

### フロントエンド (packages/frontend/)
```bash
cd packages/frontend

# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# 型チェック
pnpm typecheck
```

## Issue作成、PR作成

- Issue template .github/ISSUE_TEMPLATE/general.md
- PR template .github/PULL_REQUEST_TEMPLATE.md

## 環境要件

- Node.js >= 18.18.0
- pnpm 9.12.0

## リファレンス

- [Hardhat Documentation](https://hardhat.org/docs)
- [React Router Documentation](https://reactrouter.com/en/main)
- [Viem Documentation](https://viem.sh/)
- [ERC2612 Specification](https://eips.ethereum.org/EIPS/eip-2612)
