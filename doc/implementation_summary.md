# 在庫管理システム 実装まとめ

## 実装した機能

1. **マスタ管理**
   - 商品マスタ：商品の登録・編集・削除
   - 単位マスタ：単位の登録・編集・削除
   - 倉庫マスタ：倉庫の登録・編集・削除
   - ロットマスタ：ロットの登録・編集・削除

2. **在庫管理**
   - 在庫一覧表示
   - 商品別在庫照会
   - 倉庫別在庫照会
   - ロット別在庫照会

3. **入出庫管理**
   - 入庫登録
   - 出庫登録
   - 入出庫履歴照会

4. **月次在庫管理**
   - 月次在庫計算
   - 月次在庫照会

5. **在庫引当管理**
   - 引当登録
   - 引当照会・編集
   - 引当解除

6. **レポート機能**
   - 在庫一覧レポート
   - 月次在庫推移レポート
   - 入出庫履歴レポート
   - 引当状況レポート

## 技術スタック

- **フロントエンド**: React (Next.js), Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite (Prisma ORM)

## 実装の詳細

### データモデル設計

Prismaを使用して以下のデータモデルを実装しました：

- Item (商品)
- Unit (単位)
- ItemUnit (商品と単位の関連)
- Warehouse (倉庫)
- Lot (ロット)
- Inventory (在庫)
- InventoryTransaction (入出庫履歴)
- MonthlyInventory (月次在庫)
- Allocation (引当)

### APIエンドポイント

以下のAPIエンドポイントを実装しました：

- マスタ管理API
  - `/api/items` - 商品マスタのCRUD
  - `/api/units` - 単位マスタのCRUD
  - `/api/warehouses` - 倉庫マスタのCRUD
  - `/api/lots` - ロットマスタのCRUD

- 在庫管理API
  - `/api/inventory` - 在庫のCRUD
  - `/api/inventory/item/[itemId]` - 商品別在庫照会
  - `/api/inventory/warehouse/[warehouseId]` - 倉庫別在庫照会
  - `/api/inventory/lot/[lotId]` - ロット別在庫照会

- 入出庫管理API
  - `/api/transactions` - 入出庫履歴照会
  - `/api/transactions/inbound` - 入庫登録
  - `/api/transactions/outbound` - 出庫登録
  - `/api/transactions/[id]` - 入出庫詳細

- 月次在庫管理API
  - `/api/monthly-inventory` - 月次在庫照会
  - `/api/monthly-inventory/[year]/[month]` - 指定月の在庫照会
  - `/api/monthly-inventory/calculate/[year]/[month]` - 月次在庫計算

- 在庫引当管理API
  - `/api/allocations` - 引当のCRUD
  - `/api/allocations/[id]` - 引当詳細

- レポートAPI
  - `/api/reports/inventory` - 在庫一覧レポート
  - `/api/reports/monthly/[year]/[month]` - 月次在庫推移レポート

### フロントエンド実装

Next.jsのApp Routerを使用して以下のページを実装しました：

- ダッシュボード (`/`)
- マスタ管理 (`/master`)
  - 商品マスタ (`/master/items`)
  - 単位マスタ (`/master/units`)
  - 倉庫マスタ (`/master/warehouses`)
  - ロットマスタ (`/master/lots`)
- 在庫管理 (`/inventory`)
  - 商品別在庫照会 (`/inventory/item/[itemId]`)
  - 倉庫別在庫照会 (`/inventory/warehouse/[warehouseId]`)
  - ロット別在庫照会 (`/inventory/lot/[lotId]`)
- 入出庫管理 (`/transactions`)
  - 入庫登録 (`/transactions/inbound`)
  - 出庫登録 (`/transactions/outbound`)
  - 入出庫詳細 (`/transactions/[id]`)
- 月次在庫管理 (`/monthly`)
  - 月次在庫詳細 (`/monthly/[year]/[month]`)
- 在庫引当管理 (`/allocations`)
  - 引当登録 (`/allocations/new`)
  - 引当詳細 (`/allocations/[id]`)
  - 引当編集 (`/allocations/[id]/edit`)
- レポート (`/reports`)

### 共通コンポーネント

以下の共通コンポーネントを実装しました：

- Layout - 共通レイアウト
- Navbar - ナビゲーションバー

### スタイリング

Tailwind CSSを使用してスタイリングを実装しました。グローバルCSSファイルでは、カスタムユーティリティクラスを定義しています。

## 実装中に発生したエラーと解決策

1. TypeScriptの型エラー
   - 問題: パラメーター `warehouse` と `lot` の型が暗黙的に `any` になっているというエラー
   - 解決策: 明示的に型を指定（`(warehouse: any)` と `(lot: any)`）

2. 型の不一致エラー
   - 問題: `setSelectedAllocationId`関数に文字列型の値を渡していたが、この関数は`number | ""`型の値を期待していた
   - 解決策: 文字列を数値に変換（`parseInt(value)`）または空文字列（`""`）を渡すように修正

## 今後の拡張ポイント

- バーコード/QRコードスキャン機能の実装
- 発注管理機能の追加
- 棚卸機能の実装
- 予測分析機能の追加
- モバイルアプリ対応
- 他のデータベース（MySQL、PostgreSQL等）への移行