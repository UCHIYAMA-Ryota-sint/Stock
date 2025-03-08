# 在庫管理システム

中規模企業向けの在庫管理システムです。在庫の入出庫管理、ロット管理、倉庫管理、月次在庫管理などの機能を提供します。

## 機能

- 在庫管理
  - 在庫一覧表示
  - 商品別在庫照会
  - 倉庫別在庫照会
  - ロット別在庫照会

- 入出庫管理
  - 入庫登録
  - 出庫登録
  - 入出庫履歴照会

- 月次在庫管理
  - 月次在庫計算
  - 月次在庫照会

- 在庫引当管理
  - 引当登録
  - 引当照会
  - 引当解除

- レポート機能
  - 在庫一覧レポート
  - 月次在庫推移レポート
  - 入出庫履歴レポート
  - 引当状況レポート

- マスタ管理
  - 商品マスタ
  - 単位マスタ
  - 倉庫マスタ
  - ロットマスタ

## 技術スタック

- フロントエンド
  - React (Next.js)
  - Tailwind CSS

- バックエンド
  - Next.js (サーバーサイドAPI)
  - Prisma ORM

- データベース
  - SQLite (開発・テスト用)
  - 本番環境では他のデータベースに移行可能

## 開発環境のセットアップ

### 前提条件

- Node.js 18.0.0以上
- npm 8.0.0以上

### インストール手順

1. リポジトリをクローン

```bash
git clone <repository-url>
cd stock-app
```

2. 依存パッケージのインストール

```bash
npm install
```

3. 環境変数の設定

`.env`ファイルを作成し、以下の内容を設定します。

```
DATABASE_URL="file:./dev.db"
```

4. データベースのセットアップ

```bash
npx prisma migrate dev --name init
```

5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスして、アプリケーションを確認できます。

## データベースの初期化

開発環境でテストデータを作成するには、以下のコマンドを実行します。

```bash
npx prisma db seed
```

## ビルドと本番環境での実行

1. アプリケーションのビルド

```bash
npm run build
```

2. 本番環境での実行

```bash
npm start
```

## ディレクトリ構造

```
stock-app/
├── prisma/                  # Prismaの設定とマイグレーション
│   ├── schema.prisma       # データモデル定義
│   └── seed.ts             # シードデータ
├── public/                  # 静的ファイル
├── src/                     # ソースコード
│   ├── app/                 # Next.jsのApp Router
│   │   ├── api/            # APIルート
│   │   ├── allocations/    # 在庫引当管理ページ
│   │   ├── inventory/      # 在庫管理ページ
│   │   ├── master/         # マスタ管理ページ
│   │   ├── monthly/        # 月次在庫管理ページ
│   │   ├── reports/        # レポートページ
│   │   ├── transactions/   # 入出庫管理ページ
│   │   ├── globals.css     # グローバルCSS
│   │   ├── layout.tsx      # ルートレイアウト
│   │   └── page.tsx        # ホームページ
│   ├── components/          # 共通コンポーネント
│   └── lib/                 # ユーティリティ関数
└── package.json             # プロジェクト設定
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
