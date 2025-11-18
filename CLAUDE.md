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

## 開発ガイドライン

### スマートコントラクト
1. **セキュリティ最優先**: Reentrancy、Integer Overflow等の脆弱性に注意
2. **ガス効率**: 不要なストレージ操作を避ける
3. **テストカバレッジ**: すべての関数に対してテストを記述
4. **イベント発行**: 状態変更時は必ずイベントを発行

### フロントエンド
1. **ウォレット接続**: MetaMask等のWeb3ウォレット対応
2. **トランザクション管理**: permit署名とトランザクション実行の分離
3. **エラーハンドリング**: 各種エラーパターンへの適切な対応
4. **UI/UX**: 分配内訳の透明な表示

## 送金フロー概要

### ユーザー間送金
1. 送金情報入力（送金先、金額）
2. 分配内訳の計算・表示
3. ERC2612 permit署名
4. Routerコントラクト経由で一括分配

### 商品購入
1. Routerコントラクトへ送金・ロック
2. ロック期間の経過待機
3. 運営者による分配実行

## 環境要件

- Node.js >= 18.18.0
- pnpm 9.12.0

## リファレンス

- [Hardhat Documentation](https://hardhat.org/docs)
- [React Router Documentation](https://reactrouter.com/en/main)
- [Viem Documentation](https://viem.sh/)
- [ERC2612 Specification](https://eips.ethereum.org/EIPS/eip-2612)
