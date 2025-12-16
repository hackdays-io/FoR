# 貢献の仕方

コントリビューターの皆様、本プロジェクトにご参加いただきありがとうございます！

本ドキュメントでは、FoRプロジェクトへの貢献方法をお伝えします。

## 目次

- [はじめに](#はじめに)
- [コミュニケーション](#コミュニケーション)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [Issue と Pull Request について](#issue-と-pull-request-について)
- [コーディング規約](#コーディング規約)
- [コミットメッセージ規約](#コミットメッセージ規約)
- [Pull Request の作成方法](#pull-request-の作成方法)
- [行動規範](#行動規範)

## はじめに

FoRは [Comoris DAO](https://comoris.co/) と[Hackdays project](https://hackdays.io/) で開発しているプロダクトです。

## コミュニケーション

### Discord サーバー

[Hackdays project の Discord サーバー](https://discord.gg/hackdays)にてコミュニケーションをとっています。

- Hackdays project の Discord サーバーに入っていない場合、[こちら](https://discord.gg/hackdays)からご参加ください
- FoR のカテゴリにはいっているチャンネルで連絡を取っています

### コミュニケーションのルール

- **自分ができそうな Issue に誰もアサインされていない場合**、Issue に「やります！」等とコメントしてから開発をはじめてください
- **1 週間以上作業から離れそうな場合**は、他の人が作業を引き継げるようにしておいてください
- **1 週間以上更新されない Issue** については、assign を外させていただくことがあります
- **作業途中でも Draft Pull Request** を送ってもらえると、動きが把握しやすくなります
- **Issue に関連した質問等**は、Discord より Issue 内のコメントを活用しましょう

## 開発環境のセットアップ

### 必要な環境

- Node.js >= 18.18.0
- pnpm 9.12.0

### セットアップ手順

```bash
# リポジトリのクローン
git clone https://github.com/hackdays-io/FoR.git
cd FoR

# 依存関係のインストール
pnpm install

# 全パッケージのビルド
pnpm build

# 開発サーバーの起動
pnpm dev
```

詳細な開発手順は [CLAUDE.md](./CLAUDE.md) をご確認ください。

## Issue と Pull Request について

### Issue について

- **Issue へのコメントはご自由にどうぞ！** 新しい質問や提案なども受け付けます
- **Issue を追加する場合**、必ず既に同様の Issue が無いか検索をしてから作成してください
- **提案なども受け付けます！** 積極的に新しく Issue を作ってください
- Issue については必ず反映できると限りませんのでご了承ください
- 文言変更や見た目の大幅な変更といった、**コンテンツの意味を変えるもの**については、関係者の確認が必要です。採用される可能性もあまり高くないことをご了承ください

### 推奨 Issue

以下のラベルがついた Issue を優先して対応いただけると助かります：

- `good first issue` - 初めての方におすすめ
- `help wanted` - 助けを求めています
- `bug` - バグ修正

### Pull Request について

- **Pull Request を送る場合**、必ず対応する Issue 番号を追記してください
- **単独の Pull Request は受け付けません**。必ず Issue を作成してから PR を送ってください

## コーディング規約

### TypeScript

- **型定義を明示的に**: `any` 型の使用は避け、適切な型を定義してください
- **ESLint ルールに従う**: `pnpm lint` でチェックしてください

### スマートコントラクト

- **セキュリティ最優先**: Reentrancy、Integer Overflow 等の脆弱性に注意してください
- **ガス効率**: 不要なストレージ操作を避けてください
- **テストカバレッジ**: すべての関数に対してテストを記述してください
- **イベント発行**: 状態変更時は必ずイベントを発行してください

### フロントエンド

- **コンポーネントの再利用**: 共通コンポーネントを活用してください
- **アクセシビリティ**: セマンティックな HTML とアクセシビリティを意識してください

## Pull Request の作成方法

### 1. ブランチを作成

```bash
# 最新の main ブランチから作業ブランチを作成
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. コードを変更

必要な変更を加えてください。

### 3. テストを実行

```bash
# 全体のテスト
pnpm test

# コントラクトのテスト
cd packages/contract
pnpm test

# フロントエンドの型チェック
cd packages/frontend
pnpm typecheck
```

### 4. コミット

```bash
git add .
git commit -m "feat: 新機能の説明"
```

### 5. Push

```bash
git push origin feature/your-feature-name
```

### 6. Pull Request を作成

GitHub 上で Pull Request を作成してください。

- **タイトル**: 変更内容を簡潔に記載
- **説明**: 関連する Issue 番号（`#123`）と変更内容の詳細を記載

## 行動規範

参加にあたっては、[Code for Japan の行動規範](https://github.com/codeforjapan/codeofconduct)もご確認ください。

---

## ドキュメントの更新について

本ドキュメントの更新も大歓迎です！わかりにくい点や改善点があれば、ぜひ Issue や Pull Request でお知らせください。

---

ご質問がある場合は、[Discord](https://discord.gg/hackdays) または Issue でお気軽にお尋ねください。

皆様のご貢献をお待ちしています！
