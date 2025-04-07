# 環境変数管理ガイドライン

## 1. 基本理念

### 環境変数を使用する目的

環境変数は、アプリケーション設定を外部化してコードから分離させる手法です。これにより、同じコードベースを異なる環境（開発、テスト、本番など）で実行しても、環境ごとに適切な設定で動作させることが可能になります。

### セキュリティとコード分離の重要性

- **セキュリティの確保**: APIキーやシークレットなどの機密情報をコード内にハードコーディングせず、漏洩リスクを低減
- **コード分離**: 環境固有の値をコードから分離することで、環境間の移行がスムーズに
- **柔軟な設定変更**: デプロイのたびにコードを変更する必要なく、設定を変更可能

## 2. 環境変数の分類と設計

### 主要な環境変数カテゴリ

1. **APIキーと認証情報**
   ```typescript
   VITE_GOOGLE_API_KEY=your-api-key
   VITE_GOOGLE_MAPS_MAP_ID=your-map-id
   ```

2. **機能フラグとアプリケーション設定**
   ```typescript
   VITE_ENABLE_MARKER_CLUSTERING=true
   VITE_MAX_MARKERS=1000
   ```

3. **エンドポイントとURL**
   ```typescript
   VITE_API_BASE_URL=https://api.example.com/v1
   ```

4. **ロギングとデバッグ設定**
   ```typescript
   VITE_LOG_LEVEL=info
   ```

## 3. 環境ごとの管理戦略

### 開発環境での管理方法

```typescript
# .env.development
VITE_GOOGLE_MAPS_API_KEY=dev-api-key
VITE_LOG_LEVEL=debug
VITE_ENABLE_MOCK_DATA=true
```

### テスト環境での設定

```typescript
# .env.test
VITE_GOOGLE_MAPS_API_KEY=test-api-key
VITE_LOG_LEVEL=info
```

### 本番環境でのセキュアな管理

```typescript
# .env.production
VITE_LOG_LEVEL=warn
# APIキーなどの機密情報はCI/CDシステムから注入
```

## 4. 実装のベストプラクティス

### 型安全な環境変数アクセス

```typescript
// 環境変数アクセスのための型安全なユーティリティ
type EnvVarConfig<T> = {
  key: string;
  defaultValue?: T;
  required?: boolean;
  transform?: (value: string) => T;
};

export function getEnvVar<T>(config: EnvVarConfig<T>): T {
  const { key, defaultValue, required = false, transform } = config;
  const value = import.meta.env[key] ?? process.env[key];

  if (value === undefined) {
    if (required) {
      throw new Error(`必須環境変数 "${key}" が設定されていません。`);
    }
    return defaultValue as T;
  }

  return transform ? transform(value) : (value as unknown as T);
}
```

### バリデーションと早期エラー検出

```typescript
// 環境変数検証の例
export function validateEnvironment(): void {
  try {
    // 必須環境変数を検証
    getEnvVar({
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      required: true,
    });
    
    logger.info('環境変数の検証に成功しました');
  } catch (error) {
    logger.error('環境変数の検証に失敗しました:', error);
    throw error; // アプリケーション起動を中止
  }
}
```

### 環境変数関連のユーティリティ関数

```typescript
// ユーティリティ関数の例
export const isDevEnvironment = () => import.meta.env.DEV;
export const isProdEnvironment = () => !isDevEnvironment();

export const getGoogleMapsApiKey = () =>
  getEnvVar({ key: 'VITE_GOOGLE_MAPS_API_KEY', required: true });

export const isFeatureEnabled = (featureName: string) =>
  getEnvVar({
    key: `VITE_ENABLE_${featureName.toUpperCase()}`,
    defaultValue: false,
    transform: value => value.toLowerCase() === 'true',
  });
```

## 5. セキュリティ考慮事項

### 機密情報の保護手法

```typescript
# .gitignore
.env
.env.local
.env.*.local
```

### API制限設定のベストプラクティス

- **リファラー制限**: 特定のドメインからのみアクセスを許可
- **APIキーの権限制限**: 必要な機能のみに権限を限定
- **使用量制限**: 1日あたりの使用回数に制限を設定
- **監視とアラート**: 異常な使用パターンを検出するアラート設定

## 6. 佐渡で食えっちゃプロジェクト固有の実装

### 必須環境変数

```typescript
// 主要な環境変数
export function validateSadoProjectEnv() {
  const requiredVars = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_DATA_SOURCE_URL',
  ];

  requiredVars.forEach(varName => {
    getEnvVar({ key: varName, required: true });
  });
}
```

### プロジェクト独自の命名規則

- `VITE_` - Viteでクライアントサイドに公開される環境変数
- `VITE_GOOGLE_*` - Google関連の設定
- `VITE_ENABLE_*` - 機能フラグ（true/falseの値）
- `VITE_DATA_*` - データソース関連の設定
- `VITE_UI_*` - UI/UX関連の設定

## 7. トラブルシューティングとFAQ

### よくある問題と解決法

#### 問題：環境変数が読み込まれない
- .envファイルの位置を確認（プロジェクトルート）
- `VITE_`プレフィックスの確認
- CIパイプラインでの環境変数設定確認

#### 問題：TypeScriptでの型エラー
- env.d.tsファイルで型定義を確認
```typescript
// env.d.tsの例
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  // 他の環境変数も追加
}
```

### 環境変数関連のデバッグ手法

```typescript
// 開発環境での環境変数確認
function debugEnvVariables(): void {
  if (!import.meta.env.DEV) return;
  
  logger.debug('現在の環境変数:', {
    // 機密情報はマスク処理
    GOOGLE_MAPS_API_KEY: maskKey(getEnvVar({ 
      key: 'VITE_GOOGLE_MAPS_API_KEY', 
      defaultValue: '' 
    })),
    LOG_LEVEL: getEnvVar({ 
      key: 'VITE_LOG_LEVEL', 
      defaultValue: 'info' 
    }),
  });
}

// 機密情報のマスク処理
function maskKey(key: string): string {
  if (!key) return '[未設定]';
  if (key.length <= 8) return '********';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}
```

## 8. 推奨プラクティスチェックリスト

- [x] **環境ファイルの分離**: `.env`, `.env.development`, `.env.production`, `.env.test`
- [x] **機密情報の保護**: `.gitignore`に`.env`ファイルを追加
- [x] **サンプル設定**: 新規開発者向けに`.env.example`を提供
- [x] **型安全なアクセス**: `getEnvVar`関数による型安全なアクセス
- [x] **バリデーション**: アプリ起動時に必須環境変数を検証
- [x] **API制限設定**: Google Maps APIキーなどに適切な制限
- [x] **明確な命名規則**: 一貫した命名規則の使用

> **関連ガイドライン**: 
> - [コード最適化ガイドライン](./code_optimization_guidelines.md) - 効率的なビルド設定や依存関係の最適化
> - [ロガー使用ガイドライン](./logger_usage_guidelines.md) - 環境変数を活用したログレベル設定
>
> **参考リンク**：
> - [Vite環境変数公式ドキュメント](https://ja.vitejs.dev/guide/env-and-mode.html)
> - [TypeScriptでの環境変数型定義](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html)
> - [Google Mapsプラットフォーム認証ガイド](https://developers.google.com/maps/documentation/javascript/get-api-key)
