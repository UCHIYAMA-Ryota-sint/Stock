# データモデル設計

## 1. マスタデータ

```mermaid
erDiagram
    ITEM {
        int id PK "商品ID"
        string code "商品コード"
        string name "商品名"
        string description "説明"
        enum item_type "種類(製造品/社外品/原材料)"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    UNIT {
        int id PK "単位ID"
        string name "単位名(個/kg/ロットなど)"
        string description "説明"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    ITEM_UNIT {
        int id PK "商品単位ID"
        int item_id FK "商品ID"
        int unit_id FK "単位ID"
        float conversion_rate "換算率"
        boolean is_default "デフォルト単位フラグ"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    WAREHOUSE {
        int id PK "倉庫ID"
        string code "倉庫コード"
        string name "倉庫名"
        string description "説明"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    LOT {
        int id PK "ロットID"
        string lot_number "ロット番号"
        int item_id FK "商品ID"
        date production_date "製造日/入荷日"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    ITEM ||--o{ ITEM_UNIT : "has"
    UNIT ||--o{ ITEM_UNIT : "used_in"
    ITEM ||--o{ LOT : "has"
```

## 2. トランザクションデータ

```mermaid
erDiagram
    INVENTORY {
        int id PK "在庫ID"
        int lot_id FK "ロットID"
        int warehouse_id FK "倉庫ID"
        float quantity "数量"
        int unit_id FK "単位ID"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    INVENTORY_TRANSACTION {
        int id PK "取引ID"
        enum transaction_type "取引種類(入庫/出庫)"
        int lot_id FK "ロットID"
        int warehouse_id FK "倉庫ID"
        float quantity "数量"
        int unit_id FK "単位ID"
        datetime transaction_date "取引日時"
        string reference_number "参照番号"
        string barcode_data "バーコードデータ"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    MONTHLY_INVENTORY {
        int id PK "月次在庫ID"
        int item_id FK "商品ID"
        int lot_id FK "ロットID"
        int warehouse_id FK "倉庫ID"
        float opening_quantity "期首数量"
        float incoming_quantity "入庫数量"
        float outgoing_quantity "出庫数量"
        float closing_quantity "期末数量"
        int unit_id FK "単位ID"
        date month "年月"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    ALLOCATION {
        int id PK "引当ID"
        int lot_id FK "ロットID"
        int warehouse_id FK "倉庫ID"
        float quantity "数量"
        int unit_id FK "単位ID"
        string reference_number "参照番号"
        datetime allocation_date "引当日時"
        datetime created_at "作成日時"
        datetime updated_at "更新日時"
    }

    LOT ||--o{ INVENTORY : "stored_as"
    WAREHOUSE ||--o{ INVENTORY : "contains"
    UNIT ||--o{ INVENTORY : "measured_in"

    LOT ||--o{ INVENTORY_TRANSACTION : "involved_in"
    WAREHOUSE ||--o{ INVENTORY_TRANSACTION : "location_of"
    UNIT ||--o{ INVENTORY_TRANSACTION : "measured_in"

    ITEM ||--o{ MONTHLY_INVENTORY : "tracked_as"
    LOT ||--o{ MONTHLY_INVENTORY : "tracked_as"
    WAREHOUSE ||--o{ MONTHLY_INVENTORY : "location_of"
    UNIT ||--o{ MONTHLY_INVENTORY : "measured_in"

    LOT ||--o{ ALLOCATION : "allocated_from"
    WAREHOUSE ||--o{ ALLOCATION : "location_of"
    UNIT ||--o{ ALLOCATION : "measured_in"
```

## 3. テーブル定義

### マスタテーブル

#### ITEM（商品マスタ）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 商品ID | PRIMARY KEY, AUTOINCREMENT |
| code | TEXT | 商品コード | UNIQUE, NOT NULL |
| name | TEXT | 商品名 | NOT NULL |
| description | TEXT | 説明 | NULL許容 |
| item_type | TEXT | 種類(製造品/社外品/原材料) | NOT NULL |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

#### UNIT（単位マスタ）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 単位ID | PRIMARY KEY, AUTOINCREMENT |
| name | TEXT | 単位名(個/kg/ロットなど) | UNIQUE, NOT NULL |
| description | TEXT | 説明 | NULL許容 |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

#### ITEM_UNIT（商品単位マッピング）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 商品単位ID | PRIMARY KEY, AUTOINCREMENT |
| item_id | INTEGER | 商品ID | NOT NULL, FOREIGN KEY |
| unit_id | INTEGER | 単位ID | NOT NULL, FOREIGN KEY |
| conversion_rate | REAL | 換算率 | NOT NULL, DEFAULT 1.0 |
| is_default | BOOLEAN | デフォルト単位フラグ | NOT NULL, DEFAULT FALSE |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

#### WAREHOUSE（倉庫マスタ）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 倉庫ID | PRIMARY KEY, AUTOINCREMENT |
| code | TEXT | 倉庫コード | UNIQUE, NOT NULL |
| name | TEXT | 倉庫名 | NOT NULL |
| description | TEXT | 説明 | NULL許容 |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

#### LOT（ロットマスタ）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | ロットID | PRIMARY KEY, AUTOINCREMENT |
| lot_number | TEXT | ロット番号 | UNIQUE, NOT NULL |
| item_id | INTEGER | 商品ID | NOT NULL, FOREIGN KEY |
| production_date | DATE | 製造日/入荷日 | NOT NULL |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

### トランザクションテーブル

#### INVENTORY（在庫）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 在庫ID | PRIMARY KEY, AUTOINCREMENT |
| lot_id | INTEGER | ロットID | NOT NULL, FOREIGN KEY |
| warehouse_id | INTEGER | 倉庫ID | NOT NULL, FOREIGN KEY |
| quantity | REAL | 数量 | NOT NULL |
| unit_id | INTEGER | 単位ID | NOT NULL, FOREIGN KEY |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

#### INVENTORY_TRANSACTION（入出庫）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 取引ID | PRIMARY KEY, AUTOINCREMENT |
| transaction_type | TEXT | 取引種類(入庫/出庫) | NOT NULL |
| lot_id | INTEGER | ロットID | NOT NULL, FOREIGN KEY |
| warehouse_id | INTEGER | 倉庫ID | NOT NULL, FOREIGN KEY |
| quantity | REAL | 数量 | NOT NULL |
| unit_id | INTEGER | 単位ID | NOT NULL, FOREIGN KEY |
| transaction_date | DATETIME | 取引日時 | NOT NULL |
| reference_number | TEXT | 参照番号 | NULL許容 |
| barcode_data | TEXT | バーコードデータ | NULL許容 |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

#### MONTHLY_INVENTORY（月次在庫）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 月次在庫ID | PRIMARY KEY, AUTOINCREMENT |
| item_id | INTEGER | 商品ID | NOT NULL, FOREIGN KEY |
| lot_id | INTEGER | ロットID | NOT NULL, FOREIGN KEY |
| warehouse_id | INTEGER | 倉庫ID | NOT NULL, FOREIGN KEY |
| opening_quantity | REAL | 期首数量 | NOT NULL |
| incoming_quantity | REAL | 入庫数量 | NOT NULL |
| outgoing_quantity | REAL | 出庫数量 | NOT NULL |
| closing_quantity | REAL | 期末数量 | NOT NULL |
| unit_id | INTEGER | 単位ID | NOT NULL, FOREIGN KEY |
| month | DATE | 年月 | NOT NULL |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |

#### ALLOCATION（引当）
| フィールド名 | データ型 | 説明 | 制約 |
|------------|---------|------|------|
| id | INTEGER | 引当ID | PRIMARY KEY, AUTOINCREMENT |
| lot_id | INTEGER | ロットID | NOT NULL, FOREIGN KEY |
| warehouse_id | INTEGER | 倉庫ID | NOT NULL, FOREIGN KEY |
| quantity | REAL | 数量 | NOT NULL |
| unit_id | INTEGER | 単位ID | NOT NULL, FOREIGN KEY |
| reference_number | TEXT | 参照番号 | NULL許容 |
| allocation_date | DATETIME | 引当日時 | NOT NULL |
| created_at | DATETIME | 作成日時 | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 更新日時 | NOT NULL |