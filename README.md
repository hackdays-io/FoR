# FoR - みんなでつかって、みんなで育てるデジタルコミュニティ通貨

<p align="center">
  <strong>自然にも、私たちにもプラスの循環を届ける</strong>
</p>

## 🌿 FoRとは

FoR（フォル）は、自然資源を「消費する」のではなく、使うほどに自然を「ケアする」よう設計されたデジタルコミュニティ通貨です。

**FoRを使うたびに、少しずつ森のための資金が生まれます。** 森が豊かになれば、めぐって、その恩恵が私たちの暮らしにも還ってきます。

- 🍃 **１枚の葉を拭うような小さなケアも**
- 🏡 **ローカルなナリワイやコモンズも**
- 💚 **誰かのやさしい行為も**

FoRの輪のなかで静かにつながり、めぐりはじめる。日々の営みがきちんと循環に組み込まれ、私たちの暮らしと自然がもう一度つながりはじめる。

## ✨ 主な機能

### トークンの自動分配システム

FORトークンを送金するたびに、自動的に以下へ分配されます：

- **受取人**：指定した送金先
- **基金ウォレット**：森林保全などの活動資金
- **Burn**：トークンの焼却（価値の維持）

### 商品購入機能

- 請求ページから商品を購入
- ロック期間によるキャンセル対応
- 透明性の高い分配フロー

## 🏗️ プロジェクト構成

このリポジトリは `pnpm` で管理するモノレポ構成です。

```
FoR/
├── packages/
│   ├── contract/          # スマートコントラクト (Hardhat)
│   ├── frontend/          # Webアプリケーション (React Router)
│   └── indexer/           # Goldsky サブグラフ/インデクサー
└── pnpm-workspace.yaml
```

## 🛠️ 技術スタック

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
- **UIコンポーネント**: `packages/frontend/app/components/ui/` にプリミティブコンポーネントを集約し、これらを組み合わせてページを構築する

### インデクサー

- **Goldsky**: Subgraphホスティング
- **Graph Protocol (AssemblyScript)**: イベントマッピング
- **GraphQL**: インデックス済みデータ取得

## 🚀 ローカルセットアップ

### 必要な環境

- Node.js `>= 18.18.0`
- pnpm `9.12.0`
- Docker Desktop
- `VITE_PRIVY_APP_ID`（運営から共有される値）

### 1. リポジトリクローン & 依存関係インストール

```bash
git clone https://github.com/hackdays-io/FoR.git
cd FoR
pnpm install
```

### 2. Hardhat ローカルノード起動

別ターミナルで起動し、そのまま維持してください。

```bash
pnpm dev:node
```

### 3. コントラクトデプロイ & セットアップ

別ターミナルで実行します。`setup:local` の出力に表示される Router address を確認してください。

```bash
cd packages/contract
pnpm deploy:local
pnpm setup:local
```

### 4. Graph Node 起動

Docker Desktop が起動していることを確認してから実行します。

```bash
pnpm dev:graph
```

### 5. Indexer デプロイ

`graph-node` が起動してから、別ターミナルで実行します。

```bash
cd packages/indexer
pnpm create:localhost
pnpm deploy:localhost
```

### 6. フロントエンド起動

```bash
cp packages/frontend/.env.example packages/frontend/.env
```

`.env` を開いて以下を設定してください。

- `VITE_CHAIN_ID=31337`
- `VITE_PRIVY_APP_ID=<運営から共有された値>`

その後、別ターミナルでフロントエンドを起動します。

```bash
cd packages/frontend
pnpm dev
```

### 7. 動作確認

- `http://localhost:5173` にアクセスし、Privy ログインが表示されること
- `http://localhost:8000/subgraphs/name/for/localhost` にアクセスし、GraphQL Playground が表示されること

リセット手順や補足を含む詳細ガイドは [`CONTRIBUTING.md`](./CONTRIBUTING.md) を参照してください。

### パッケージ別コマンド

#### コントラクト (`packages/contract/`)

```bash
cd packages/contract

# コンパイル
pnpm build

# テスト
pnpm test

# ローカルデプロイ
pnpm deploy:local
pnpm setup:local
```

#### フロントエンド (`packages/frontend/`)

```bash
cd packages/frontend

# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# React Router の型生成
pnpm typegen
```

#### インデクサー (`packages/indexer/`)

```bash
cd packages/indexer

# localhost 向けサブグラフ作成
pnpm create:localhost

# localhost 向けサブグラフデプロイ
pnpm deploy:localhost

# Sepolia へのデプロイ
pnpm deploy:sepolia
```

## 📚 ドキュメント

- [開発ガイド](./CLAUDE.md) - 開発の詳細な情報
- [コントリビューションガイド](./CONTRIBUTING.md) - 貢献方法

## 🤝 コントリビューション

FoRはオープンソースプロジェクトです。貢献を歓迎します！

詳しくは [CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

## 🔗 リンク

- [Hackdays project Discord](https://discord.gg/hackdays) - コミュニケーションの場
- [Code for Japan 行動規範](https://github.com/codeforjapan/codeofconduct)

---

<p align="center">
  <strong>みんなでつかって、みんなで育てる。それが、FoRです。</strong>
</p>
