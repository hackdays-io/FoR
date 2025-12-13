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
│   └── frontend/          # Webアプリケーション (React Router)
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

## 🚀 セットアップ

### 環境要件

- Node.js >= 18.18.0
- pnpm 9.12.0

### インストール

```bash
# 依存関係のインストール
pnpm install

# 全パッケージのビルド
pnpm build

# 開発サーバー起動
pnpm dev
```

### パッケージ別コマンド

#### コントラクト (packages/contract/)

```bash
cd packages/contract

# コンパイル
pnpm build

# テスト
pnpm test

# デプロイ
pnpm deploy
```

#### フロントエンド (packages/frontend/)

```bash
cd packages/frontend

# 開発サーバー起動
pnpm dev

# プロダクションビルド
pnpm build

# 型チェック
pnpm typecheck
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
