# トラブルシューティング

## 実行時に発生したエラーと解決策

### 1. Next.jsの設定ファイル形式エラー

**エラー内容**:
```
Error: Configuring Next.js via 'next.config.ts' is not supported. Please replace the file with 'next.config.js' or 'next.config.mjs'.
```

**原因**:
Next.jsは設定ファイルとして`next.config.ts`をサポートしていません。

**解決策**:
`next.config.ts`を`next.config.js`に変換しました。

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

module.exports = nextConfig;
```

### 2. Prismaのenum型エラー

**エラー内容**:
```
Error: Prisma schema validation - (validate wasm)
Error code: P1012
error: Error validating: You defined the enum `ItemType`. But the current connector does not support enums.
```

**原因**:
SQLiteデータベースはenum型をサポートしていません。

**解決策**:
Prismaスキーマのenum型を文字列型に変更しました。

変更前:
```prisma
enum ItemType {
  MANUFACTURED // 製造品
  EXTERNAL     // 社外品
  RAW_MATERIAL // 原材料
}
```

変更後:
```prisma
// 商品マスタ
model Item {
  id          Int       @id @default(autoincrement())
  code        String    @unique
  name        String
  description String?
  itemType    String    // "MANUFACTURED", "EXTERNAL", "RAW_MATERIAL"
  // ...
}
```

### 3. Prismaの環境変数エラー

**エラー内容**:
Prismaがデータベース接続URLを見つけられないエラー

**解決策**:
`.env`ファイルを作成し、`DATABASE_URL`を設定しました。

```
DATABASE_URL="file:./prisma/dev.db"
```

## 実行手順

1. 依存パッケージのインストール
```bash
cd stock-app
npm install
```

2. 必要なモジュールの追加インストール
```bash
npm install autoprefixer --save-dev
```

3. データベースのセットアップ
```bash
npx prisma migrate dev --name init
```

4. 開発サーバーの起動
```bash
npm run dev
```

5. ブラウザで http://localhost:3000 にアクセス

## 注意点

- SQLiteを使用する場合、enum型は使用できないため、文字列型を使用する
- Next.jsの設定ファイルは`next.config.js`または`next.config.mjs`を使用する
- Prismaを使用する場合は、`.env`ファイルに`DATABASE_URL`を設定する