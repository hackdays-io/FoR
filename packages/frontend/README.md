# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## GraphQL Codegen

サブグラフのスキーマから型安全なコードを自動生成しています。

### 型の再生成

```bash
pnpm codegen
```

### indexer（サブグラフ）が更新された場合

`packages/indexer/schema.graphql` のエンティティやフィールドが変更された場合、以下の手順で対応してください。

1. **`packages/frontend/schema.graphql` を更新する**
   - indexer の `schema.graphql` の変更に合わせて、フロントエンド用スキーマファイルを更新する
   - このファイルには The Graph のカスタムスカラー（`BigInt`, `Bytes` 等）、`OrderDirection` enum、`Query` 型の定義が含まれる
   - indexer のスキーマにエンティティが追加された場合、対応する `_orderBy` enum と `Query` フィールドも追加する

2. **`app/graphql/queries.ts` を更新する**
   - 新しいエンティティやフィールドに対応するクエリを追加・修正する

3. **`pnpm codegen` を実行する**
   - `app/gql/` 以下に型定義ファイルが再生成される

4. **hooks を確認する**
   - `app/hooks/` 内の各hookが生成された型を使用しているか確認する
   - 手動の型定義ではなく `~/gql/graphql` からインポートした型を使用すること

### ファイル構成

```
schema.graphql          # フロントエンド用スキーマ（indexerのスキーマ + カスタムスカラー + Query型）
codegen.ts              # graphql-codegen 設定
app/gql/                # 自動生成ファイル（.gitignore済み、手動編集禁止）
app/graphql/queries.ts  # GraphQLクエリ定義（集約ファイル）
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

FoR-specific design token operation rules live at:

- `app/design-tokens.md`

---

Built with ❤️ using React Router.
