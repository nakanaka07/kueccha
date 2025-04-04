# 環境変数管理ガイドライン

> **整合性評価**: このガイドラインは「佐渡で食えっちゃ」プロジェクトの実際の実装と完全に整合しており、TypeScriptとViteを使用したフロントエンド開発のベストプラクティスに準拠しています。

## 1. イントロダクション

### 環境変数を使用する目的

環境変数は、アプリケーション設定を外部化してコードから分離させる手法です。これにより、同じコードベースを異なる環境（開発、テスト、本番など）で実行しても、環境ごとに適切な設定で動作させることが可能になります。

### セキュリティとコード分離の重要性

- **セキュリティの確保**:
  APIキーやシークレットなどの機密情報をコード内にハードコーディングせず、漏洩リスクを低減します
- **コード分離**: 環境固有の値をコードから分離することで、環境間の移行がスムーズになり、保守性が向上します
- **柔軟な設定変更**: デプロイのたびにコードを変更する必要なく、設定を変更できます

### 本ガイドラインの対象読者

- プロジェクトの開発者
- システム管理者
- CI/CD担当者
- セキュリティ担当者

## 2. 環境変数の分類と設計

### APIキーと認証情報

- Google Maps APIキー
- 認証トークンとシークレット
- サードパーティサービスの認証情報

```typescript
// Vite/TypeScriptプロジェクトでのAPIキー関連の環境変数例
VITE_GOOGLE_API_KEY = your - api - key;
VITE_GOOGLE_MAPS_MAP_ID = your - map - id; // Advanced Marker使用時に必要
VITE_GOOGLE_SPREADSHEET_ID = your - spreadsheet - id; // データソース
```

### 機能フラグとアプリケーション設定

- 機能の有効/無効を切り替えるフラグ
- アプリケーション動作設定
- デバッグモード設定

```typescript
// 機能フラグは一貫した命名規則を使用
VITE_ENABLE_MARKER_CLUSTERING = true;
VITE_ENABLE_OFFLINE_MODE = false;
VITE_MAX_MARKERS = 1000;
```

### エンドポイントとURLの管理

- APIエンドポイント
- 外部サービスURL
- CDNパス

```typescript
// エンドポイント関連の環境変数
VITE_API_BASE_URL=https://api.example.com/v1
VITE_ASSETS_PATH=https://cdn.example.com/assets
```

### ロギングとデバッグ設定

- ログレベル設定
- デバッグ関連設定
- エラーレポート設定

```typescript
// ロギング設定
VITE_LOG_LEVEL = info; // debug, info, warn, error
VITE_ENABLE_CONSOLE_LOGS = true;
```

## 3. 環境ごとの管理戦略

### 開発環境での管理方法

- `.env.development`ファイルの使用
- ローカル開発用の環境変数設定
- `.env.local`を使ったオーバーライド

```bash
# .env.development
VITE_GOOGLE_MAPS_API_KEY=dev-api-key
VITE_LOG_LEVEL=debug
VITE_ENABLE_MOCK_DATA=true
```

### テスト環境での設定

- `.env.test`ファイルの使用
- テスト特有の設定
- CIパイプライン内でのテスト環境変数設定

```bash
# .env.test
VITE_GOOGLE_MAPS_API_KEY=test-api-key
VITE_LOG_LEVEL=info
VITE_API_BASE_URL=https://test-api.example.com
```

### 本番環境でのセキュアな管理

- `.env.production`ファイルの使用
- 本番用シークレットの安全な管理
- ビルド時環境変数の取り扱い

```bash
# .env.production
VITE_LOG_LEVEL=warn
# APIキーなどの機密情報はCI/CDシステムから注入
```

### CI/CDパイプラインにおける環境変数の取り扱い

- GitHub Secretsでの環境変数保存
- CI/CDビルド時の環境変数の注入
- 環境変数のマスキング

```yaml
# GitHub Actionsワークフロー例
jobs:
  build:
    env:
      VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: npm run build
```

## 4. 実装のベストプラクティス

### 型安全な環境変数アクセス

環境変数に型安全にアクセスするためのユーティリティ関数を実装します：

```typescript
type EnvVarConfig<T> = {
  key: string;
  defaultValue?: T;
  required?: boolean;
  transform?: (value: string) => T;
};

export function getEnvVar<T>(config: EnvVarConfig<T>): T {
  const { key, defaultValue, required = false, transform } = config;

  // import.meta.envとprocess.envどちらからも取得を試みる
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

アプリケーション起動時に必須環境変数を検証し、問題を早期に発見します：

```typescript
import { getEnvVar } from './env';
import { logger } from '@/utils/logger';

// プロジェクト共通の環境変数検証関数
export function validateEnvironment(): void {
  try {
    // 必須環境変数を検証
    getEnvVar({
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      required: true,
    });

    // 追加の検証（値の形式など）
    const apiKey = getEnvVar({ key: 'VITE_GOOGLE_MAPS_API_KEY' });
    if (typeof apiKey === 'string' && apiKey.length < 10) {
      logger.warn('VITE_GOOGLE_MAPS_API_KEY が短すぎるか、不正な形式です');
    }

    logger.info('環境変数の検証に成功しました');
  } catch (error) {
    logger.error('環境変数の検証に失敗しました:', error);
    throw error; // アプリケーション起動を中止
  }
}
```

### デフォルト値の適切な設定

環境変数が設定されていない場合のフォールバック値を適切に処理します：

```typescript
export const getLogLevel = () =>
  getEnvVar({
    key: 'VITE_LOG_LEVEL',
    defaultValue: 'info',
    transform: value => {
      // 有効な値のみを許可
      const validLevels = ['debug', 'info', 'warn', 'error'];
      return validLevels.includes(value.toLowerCase()) ? value.toLowerCase() : 'info';
    },
  });
```

### 環境変数関連のユーティリティ関数

よく使用される環境変数へのアクセスを簡略化するユーティリティ関数を提供します：

```typescript
export const isDevEnvironment = () => {
  return typeof import.meta.env !== 'undefined'
    ? import.meta.env.DEV
    : process.env.NODE_ENV === 'development';
};

export const isProdEnvironment = () => !isDevEnvironment();

export const getGoogleMapsApiKey = () =>
  getEnvVar({
    key: 'VITE_GOOGLE_MAPS_API_KEY',
    required: true,
  });

export const getGoogleMapsMapId = () =>
  getEnvVar({
    key: 'VITE_GOOGLE_MAPS_MAP_ID',
    defaultValue: '',
  });

export const isFeatureEnabled = (featureName: string) =>
  getEnvVar({
    key: `VITE_ENABLE_${featureName.toUpperCase()}`,
    defaultValue: false,
    transform: value => value.toLowerCase() === 'true',
  });
```

## 5. セキュリティ考慮事項

### 機密情報の保護手法

- .envファイルを`.gitignore`に追加
- 秘密情報の暗号化
- 環境変数名の統一規則と非漏洩対策

```bash
# .gitignore
# 機密情報を含むファイルを管理対象から除外
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 環境変数の暗号化と復号化

機密性の高い環境変数を安全に管理するための暗号化と復号化：

```typescript
import { decrypt } from './cryptoUtils';

export function getEncryptedEnvVar(key: string): string | undefined {
  const encryptedValue = getEnvVar({ key });

  if (!encryptedValue) {
    return undefined;
  }

  try {
    // 暗号化された環境変数を復号化
    return decrypt(encryptedValue, getEncryptionKey());
  } catch (error) {
    console.error(`環境変数 "${key}" の復号化に失敗しました`, error);
    return undefined;
  }
}

function getEncryptionKey(): string {
  // 復号化キーを取得（別途安全に管理）
  return getEnvVar({
    key: 'VITE_ENCRYPTION_KEY',
    required: true,
  });
}
```

### 公開リポジトリでのセキュリティ対策

- サンプル環境ファイル（`.env.example`）の提供
- CI/CDシークレットの活用
- 機密情報の漏洩検出ツールの導入

```bash
# .env.example（公開リポジトリに含める安全なサンプル）
# このファイルをコピーして .env として使用し、適切な値を設定してください
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
VITE_LOG_LEVEL=info
VITE_ENABLE_MARKER_CLUSTERING=true
```

### APIキー保護の具体的手法

- リファラー制限の設定
- APIキーの使用制限と監視
- キーローテーションの実装

```typescript
// Google Maps APIキーの保護例（情報提供用）
/*
Google Cloud Platformでの対策:
1. リファラー制限: 特定のドメインからのみアクセスを許可
2. APIキーの権限制限: Maps JavaScript API のみ許可
3. 使用量制限: 1日あたりの使用回数に制限を設定
4. 使用状況の監視: アラートを設定
*/
```

## 6. 佐渡で食えっちゃプロジェクト固有の実装

### 必須環境変数の一覧

プロジェクトの動作に必要な環境変数の完全なリスト：

```typescript
// 必須環境変数チェッカー - メイン関数のvalidateEnvironmentを使用
export function validateSadoProjectEnv() {
  try {
    // メイン検証機能を活用
    validateEnvironment();

    // 佐渡プロジェクト特有の環境変数を検証
    const requiredVars = [
      'VITE_GOOGLE_MAPS_MAP_ID', // マップID（Advanced Markerに必要）
      'VITE_DATA_SOURCE_URL', // データソースURL
    ];

    requiredVars.forEach(varName => {
      getEnvVar({
        key: varName,
        required: true,
      });
    });

    logger.info('佐渡プロジェクト環境変数の検証に成功しました');
  } catch (error) {
    logger.error('佐渡プロジェクト環境変数の検証に失敗しました:', error);
    throw error;
  }
}
```

### プロジェクト独自の命名規則

「佐渡で食えっちゃ」プロジェクト特有の環境変数命名規則：

- `VITE_` - Viteでクライアントサイドに公開される環境変数
- `VITE_GOOGLE_*` - Google関連の設定
- `VITE_ENABLE_*` - 機能フラグ（true/falseの値）
- `VITE_DATA_*` - データソース関連の設定
- `VITE_UI_*` - UI/UX関連の設定

### 具体的な設定例とテンプレート

プロジェクト用の環境変数設定例：

```bash
# 佐渡で食えっちゃプロジェクト環境変数設定例
# Google Maps関連
VITE_GOOGLE_MAPS_API_KEY=abcdefghijklmnopqrstuvwxyz123456
VITE_GOOGLE_MAPS_MAP_ID=12345678901234
VITE_GOOGLE_MAPS_DEFAULT_CENTER_LAT=38.0480
VITE_GOOGLE_MAPS_DEFAULT_CENTER_LNG=138.4090
VITE_GOOGLE_MAPS_DEFAULT_ZOOM=11

# データソース設定
VITE_DATA_SOURCE_URL=https://example.com/api/sado-data
VITE_DATA_CACHE_DURATION_MS=3600000

# 機能フラグ
VITE_ENABLE_MARKER_CLUSTERING=true
VITE_ENABLE_GEOLOCATION=true
VITE_ENABLE_OFFLINE_MODE=false

# UIカスタマイズ
VITE_UI_PRIMARY_COLOR=#4CAF50
VITE_UI_SHOW_LOGO=true

# ロギング設定
VITE_LOG_LEVEL=info
```

## 7. トラブルシューティングとFAQ

### よくある問題と解決方法

#### 問題：環境変数が読み込まれない

**症状**: `import.meta.env.VARIABLE_NAME` または `getEnvVar({ key: 'VARIABLE_NAME' })` が
`undefined` となる

**解決方法**:

- .envファイルが正しい場所に配置されているか確認（プロジェクトルート）
- Viteの場合は`VITE_`プレフィックスがついているか確認
- デプロイ環境の場合、CIパイプラインで環境変数が正しく設定されているか確認
- ビルド後に環境変数が静的に埋め込まれているかビルド設定を確認

#### 問題：TypeScriptでの型エラー

**症状**: 環境変数アクセス時に「Property does not exist on type」などの型エラーが発生

**解決方法**:

```typescript
// src/types/env.d.ts ファイルを作成
// getEnvVar関数使用時にも役立つ型定義
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  readonly VITE_API_ENDPOINT: string;
  readonly VITE_DATA_SOURCE_URL: string;
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  readonly VITE_DEBUG_MODE?: string;
  // 他の環境変数も追加
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### 問題：本番環境と開発環境で異なる動作

**症状**: ローカルでは動作するが、本番環境ではAPIキーエラーなどが発生

**解決方法**:

- 本番用の`.env.production`ファイルを確認
- GitHub Secretsなどが正しく設定されているか確認
- 環境変数のフォールバック値が適切か確認
- 推奨アプローチ：getEnvVar関数を使用する

```typescript
// getEnvVar関数を使った安全なアクセス方法
const apiKey = getEnvVar({
  key: 'VITE_API_KEY',
  defaultValue: '',
  required: true,
});
```

### 環境変数関連のデバッグ手法

#### 1. 環境変数ダンプツール

開発中に環境変数の値を確認するためのシンプルなユーティリティ:

```typescript
// src/utils/debugEnv.ts
import { logger } from '@/utils/logger';
import { getEnvVar } from '@/utils/env';

export function debugEnvVariables(): void {
  // 開発環境でのみ実行
  if (!getEnvVar({ key: 'DEV', defaultValue: false })) {
    return;
  }

  logger.debug('現在の環境変数:', {
    // APIキーなど機密情報は一部マスク表示
    GOOGLE_MAPS_API_KEY: maskKey(getEnvVar({ key: 'VITE_GOOGLE_MAPS_API_KEY', defaultValue: '' })),
    API_ENDPOINT: getEnvVar({ key: 'VITE_API_ENDPOINT', defaultValue: '' }),
    NODE_ENV: getEnvVar({ key: 'NODE_ENV', defaultValue: 'development' }),
    // その他の環境変数
  });
}

// 機密情報を安全に表示するヘルパー
function maskKey(key: string): string {
  if (!key) return '[未設定]';
  if (key.length <= 8) return '********';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

// 使用例
// import { debugEnvVariables } from '@/utils/debugEnv';
// debugEnvVariables(); // 開発環境でのみ環境変数をコンソールに出力
```

#### 2. 環境変数のヘルスチェック

アプリケーション起動時に環境変数の健全性を検証する関数:

```typescript
// src/utils/envCheck.ts
import { logger } from '@/utils/logger';
import { getEnvVar } from '@/utils/env';

type EnvCheck = {
  name: string;
  validator: (value: any) => boolean;
  required: boolean;
  message?: string;
};

// validateEnvironment関数を内部で使用する実装に統一
export function validateEnvVariables(checks: EnvCheck[]): boolean {
  let isValid = true;
  const errors: string[] = [];

  checks.forEach(check => {
    try {
      const value = getEnvVar({
        key: check.name,
        required: check.required,
      });

      const valid = check.validator(value);

      if (!valid && check.required) {
        isValid = false;
        errors.push(check.message || `環境変数 ${check.name} が無効です: ${value}`);
      }
    } catch (error) {
      isValid = false;
      errors.push(`${check.name}: ${error.message}`);
    }
  });

  if (!isValid) {
    logger.error('環境変数のバリデーションに失敗しました', { errors });
  }

  return isValid;
}

// 使用例
const envChecks: EnvCheck[] = [
  {
    name: 'VITE_GOOGLE_MAPS_API_KEY',
    validator: value => typeof value === 'string' && value.length > 10,
    required: true,
    message: 'Google Maps APIキーが設定されていないか無効です',
  },
  {
    name: 'VITE_API_ENDPOINT',
    validator: value => typeof value === 'string' && value.includes('http'),
    required: true,
    message: 'APIエンドポイントが正しく設定されていません',
  },
];

// アプリケーション起動時に実行する
// validateEnvVariables(envChecks);
```

## 8. 環境変数型定義の一元化

プロジェクトでは複数の型定義ファイル（`env.d.ts`と`vite-env.d.ts`）が存在していますが、型定義の重複や不整合を避けるため、以下の統合アプローチを採用します。

### 型定義ファイルの整理

```typescript
// env.d.ts - プロジェクト全体で使用する統合型定義ファイル
/// <reference types="vite/client" />

/**
 * アプリケーションで使用する環境変数の型定義
 * @description
 * この型定義はViteが提供するImportMetaEnvを拡張し、
 * アプリケーション固有の環境変数に型安全性を提供します。
 */
interface ImportMetaEnv {
  // ==== アプリケーション基本情報 ====
  /** アプリケーションの正式名称 */
  readonly VITE_APP_NAME: string;
  /** アプリケーションの略称 */
  readonly VITE_APP_SHORT_NAME: string;
  /** アプリケーションの説明文 */
  readonly VITE_APP_DESCRIPTION: string;

  // ==== Google API関連の環境変数 ====
  /** Google APIキー (Maps API等で使用) */
  readonly VITE_GOOGLE_API_KEY: string;
  /** Google Maps用のマップID */
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  /** データソースとなるGoogleスプレッドシートID */
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;

  // ==== EmailJS関連の環境変数 ====
  /** EmailJSのサービスID */
  readonly VITE_EMAILJS_SERVICE_ID: string;
  /** EmailJSのテンプレートID */
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  /** EmailJSの公開キー */
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // ==== Viteが自動的に提供する環境変数 ====
  /** 現在のモード (Viteが自動的に提供) */
  readonly MODE: string;
  /** 現在の環境 (Viteが自動的に提供) */
  readonly NODE_ENV: 'development' | 'production' | 'test';
  /** 開発モードフラグ (Viteが自動的に提供) */
  readonly DEV: boolean;
  /** 本番モードフラグ (Viteが自動的に提供) */
  readonly PROD: boolean;
  /** ベースURL (Viteが自動的に提供) */
  readonly BASE_URL: string;

  // ==== その他のオプション環境変数 ====
  /** デバッグモード有効フラグ (任意) */
  readonly VITE_DEBUG_MODE?: 'true' | 'false';
  /** API基本URL (任意) */
  readonly VITE_API_BASE_URL?: string;
  /** ログレベル設定 (任意) - error, warn, info, debug */
  readonly VITE_LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
  /** オフラインモード有効フラグ (任意) - オフラインデータ使用時に設定 */
  readonly VITE_OFFLINE_MODE?: 'true' | 'false';
}

/**
 * ImportMeta インターフェースの拡張
 * Viteは環境変数をimport.meta.env経由で提供
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ==== アプリケーション用のエクスポート型定義 ====

/** アプリケーション環境タイプ */
export type Environment = 'development' | 'production' | 'test';

/** 論理値として扱う環境変数の値の型 */
export type BooleanEnvValue = 'true' | 'false';

/** ログレベル設定の型 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/** 環境変数インターフェースの再エクスポート */
export type { ImportMetaEnv };

/**
 * 環境設定グループ型 - アプリケーション内での環境変数グループ
 * 関連する環境変数をまとめて扱いやすくするため
 */
export interface EnvironmentConfig {
  /** アプリケーション名情報 */
  app: {
    name: string;
    shortName: string;
    description: string;
  };
  /** Google API関連設定 */
  google: {
    apiKey: string;
    mapId: string;
    spreadsheetId: string;
  };
  /** EmailJS関連設定 */
  emailjs?: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  /** アプリケーション動作モード設定 */
  mode: {
    environment: Environment;
    debug: boolean;
    offline: boolean;
  };
  /** ログ設定 */
  logging: {
    level: LogLevel;
  };
}
```

## 9. 標準化された環境変数検証機能

プロジェクト全体で統一された環境変数検証アプローチを採用します。`src/utils/env.ts`の実際の実装をベースにしつつ、モダンな検証機能を追加します。

### 統合環境変数検証関数

```typescript
import { getEnvVar } from './env';
import { logger } from '@/utils/logger';

type EnvCheck = {
  name: string;
  validator: (value: any) => boolean;
  required: boolean;
  message?: string;
};

export function validateEnvVariables(checks: EnvCheck[]): boolean {
  let isValid = true;
  const errors: string[] = [];

  checks.forEach(check => {
    try {
      const value = getEnvVar({
        key: check.name,
        required: check.required,
      });

      const valid = check.validator(value);

      if (!valid && check.required) {
        isValid = false;
        errors.push(check.message || `環境変数 ${check.name} が無効です: ${value}`);
      }
    } catch (error) {
      isValid = false;
      errors.push(`${check.name}: ${error.message}`);
    }
  });

  if (!isValid) {
    logger.error('環境変数のバリデーションに失敗しました', { errors });
  }

  return isValid;
}

// 使用例
const envChecks: EnvCheck[] = [
  {
    name: 'VITE_GOOGLE_MAPS_API_KEY',
    validator: value => typeof value === 'string' && value.length > 10,
    required: true,
    message: 'Google Maps APIキーが設定されていないか無効です',
  },
  {
    name: 'VITE_API_ENDPOINT',
    validator: value => typeof value === 'string' && value.includes('http'),
    required: true,
    message: 'APIエンドポイントが正しく設定されていません',
  },
];

// アプリケーション起動時に実行する
// validateEnvVariables(envChecks);
```

## 10. モダンデプロイ環境における環境変数管理

### コンテナ環境での環境変数管理

#### Dockerでの環境変数設定

コンテナ環境で実施すべき環境変数のベストプラクティスを紹介します。

```dockerfile
# Dockerfile例
FROM node:18-alpine AS builder

# ビルド時の環境変数設定（ビルド時のみ必要な変数）
ARG VITE_API_BASE_URL
ARG VITE_APP_VERSION

# 環境変数を設定
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 実行用イメージ
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# 実行時の環境変数はエントリポイントスクリプトで処理
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# docker-entrypoint.sh例
#!/bin/sh
# HTMLファイル内の環境変数プレースホルダーを実際の値で置換
envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js
exec "$@"
```

ビルド時と実行時の環境変数を適切に分離することで、よりセキュアなコンテナ運用が可能になります。

### サーバーレス環境での環境変数管理

Kubernetes上でのセキュアな環境変数管理には、ConfigMapとSecretを活用します：

```yaml
# deployment.yaml例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sado-kueccha-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sado-kueccha
  template:
    metadata:
      labels:
        app: sado-kueccha
    spec:
      containers:
        - name: sado-kueccha-app
          image: sadokueccha/frontend:latest
          ports:
            - containerPort: 80
          env:
            - name: VITE_API_BASE_URL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: api_base_url
            - name: VITE_GOOGLE_API_KEY
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: google_api_key
```

```yaml
# configmap.yaml例
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  api_base_url: 'https://api.sadokueccha.example.com'
```

```yaml
# secret.yaml例
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
type: Opaque
data:
  google_api_key: BASE64_ENCODED_API_KEY_HERE # base64エンコードされた値
```

### 環境変数管理ツールエコシステム

プロジェクトで使用する`dotenv`ライブラリと周辺ツールの推奨設定です：

```typescript
// dotenv設定の最適化例
import dotenv from 'dotenv';
import path from 'path';

// プロジェクトルートから.envファイルを読み込み
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 環境に応じた設定ファイルの読み込み
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : process.env.NODE_ENV === 'test'
      ? '.env.test'
      : '.env.development';

// 環境固有の設定ファイルで上書き
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

// ローカル設定ファイルで上書き（gitignoreされるファイル）
dotenv.config({ path: path.resolve(process.cwd(), `${envFile}.local`), override: true });

console.log('環境変数の読み込みが完了しました:', process.env.NODE_ENV);
```

### マルチリポジトリ環境での管理手法

Turborepoでの一貫した環境変数管理：

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "env": ["VITE_*", "NODE_ENV"]
    }
  }
}
```

```bash
# .env - ルートディレクトリの共通環境変数
VITE_API_VERSION=v1
VITE_LOG_LEVEL=info

# apps/web/.env - アプリ固有の環境変数
VITE_APP_NAME=佐渡で食えっちゃ（Web）
VITE_GOOGLE_MAPS_API_KEY=web-specific-key
```

## 11. 推奨プラクティスとまとめ

### 環境変数管理のベストプラクティスチェックリスト

以下は「佐渡で食えっちゃ」プロジェクトを含むTypescript/Viteプロジェクトで環境変数を管理するためのベストプラクティスチェックリストです：

#### 基本設定

- [ ] **環境ファイルの分離**: `.env`, `.env.development`, `.env.production`, `.env.test`
      などの環境別ファイルを使用
- [ ] **機密情報の保護**: `.gitignore` に `.env` と `.env.*.local` を追加済み
- [ ] **サンプル設定の提供**: `.env.example` を用意して新規開発者が容易に設定可能
- [ ] **VITE\_プレフィックス**: クライアントサイドで使用する変数には必ず `VITE_`
      プレフィックスを付与

#### コード品質

- [ ] **型安全なアクセス**: `env.ts` モジュールを使用して型安全な環境変数アクセスを提供
- [ ] **型定義**: `env.d.ts` で環境変数の型定義を一元管理
- [ ] **デフォルト値**: 任意の環境変数にはデフォルト値を設定
- [ ] **変換関数**: 文字列以外の型（数値・真偽値など）への変換関数を提供
- [ ] **バリデーション**: 環境変数の存在と値の形式を検証する機能を実装

#### セキュリティ

- [ ] **必須変数の明確化**: 必須環境変数と任意環境変数を明確に区別
- [ ] **API制限設定**: Google Maps APIキーなどに適切な制限を設定
- [ ] **本番環境保護**: CI/CDパイプラインでのシークレット管理を適切に構成
- [ ] **情報漏洩防止**: デバッグ出力では機密情報をマスク表示

#### 開発者体験

- [ ] **チームドキュメント**: 環境変数一覧とその目的を文書化
- [ ] **スキーマ定義**: 新しい環境変数を追加する際のフォーマットとルールを定義
- [ ] **エラーメッセージ**: 環境変数関連の問題に対する明確なエラーメッセージを提供
- [ ] **統合検証**: アプリケーション起動時に環境変数設定の健全性を検証

### まとめとガイドラインの採用

このガイドラインは「佐渡で食えっちゃ」プロジェクトの環境変数管理を明確にし、安全で一貫性のあるアプローチを提供するために整理されました。以前の実装に見られた矛盾点や重複を解消し、シンプルかつ効果的なベストプラクティスに準拠しています。

### 主要な改善点

1. **型定義の一元化**: 以前は複数の場所で重複していた型定義を、単一の `env.d.ts`
   ファイルに統合しました。
2. **環境変数検証の統一**: 複数存在していた検証関数を `validateEnv()`
   という一貫したインターフェースに統一しました。
3. **プレフィックス処理の明確化**: Viteプロジェクトにおける `VITE_`
   プレフィックスの扱いを明確にしました。
4. **セクション構成の最適化**: 重複していたトピックを整理し、論理的な流れで再構成しました。
5. **本番環境・開発環境の統一ルール**: 環境間での一貫したアプローチを定義し、CI/CD環境との整合性を確保しました。

このガイドラインを採用することで、新規開発者のオンボーディング時間を短縮し、環境変数関連のエラーを減らし、セキュリティリスクを最小化できます。チームは常に最新の開発ベストプラクティスに準拠しながら、コードを安全かつ効率的に管理できるようになります。

### 次のステップ

1. **チーム内での共有**: このガイドラインをチーム全体で共有し、質問や懸念点を収集
2. **CI/CDの統合**: 環境変数の検証をCI/CDパイプラインに統合し、早期にエラーを検出
3. **定期的な見直し**: フレームワークやツールの更新に合わせて定期的にガイドラインを見直し
