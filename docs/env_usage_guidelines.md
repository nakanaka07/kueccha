# 環境変数管理ガイドライン

> **最終更新日**: 2025年4月10日  
> **バージョン**: 1.3.0  
> **作成者**: 佐渡で食えっちゃプロジェクトチーム

## 目次

- [1. 基本理念](#1-基本理念)
  - [環境変数を使用する目的](#環境変数を使用する目的)
  - [セキュリティとコード分離の重要性](#セキュリティとコード分離の重要性)
- [2. Viteでの環境変数の基本](#2-viteでの環境変数の基本)
  - [環境変数の動作原理](#環境変数の動作原理)
  - [環境変数ファイルの優先順位](#環境変数ファイルの優先順位)
  - [環境変数の型と変換](#環境変数の型と変換)
- [3. 環境変数の分類と設計](#3-環境変数の分類と設計)
  - [主要な環境変数カテゴリ](#主要な環境変数カテゴリ)
  - [命名規則とベストプラクティス](#命名規則とベストプラクティス)
- [4. 環境ごとの管理戦略](#4-環境ごとの管理戦略)
  - [開発環境での管理方法](#開発環境での管理方法)
  - [テスト環境での設定](#テスト環境での設定)
  - [本番環境でのセキュアな管理](#本番環境でのセキュアな管理)
  - [サンプル設定ファイルの提供](#サンプル設定ファイルの提供)
- [5. 実装のベストプラクティス](#5-実装のベストプラクティス)
  - [環境変数アクセスの一元管理](#環境変数アクセスの一元管理)
  - [バリデーションと早期エラー検出](#バリデーションと早期エラー検出)
  - [TypeScriptでの型定義](#typescriptでの型定義)
- [6. セキュリティ考慮事項](#6-セキュリティ考慮事項)
  - [機密情報の保護手法](#機密情報の保護手法)
  - [環境変数値のサニタイズ](#環境変数値のサニタイズ)
  - [API制限設定のベストプラクティス](#api制限設定のベストプラクティス)
  - [CI/CDでのシークレット管理](#cicdでのシークレット管理)
- [7. 佐渡で食えっちゃプロジェクト固有の実装](#7-佐渡で食えっちゃプロジェクト固有の実装)
  - [必須環境変数](#必須環境変数)
  - [プロジェクト独自の命名規則](#プロジェクト独自の命名規則)
- [8. 環境変数の高度な使用法](#8-環境変数の高度な使用法)
  - [dotenv-expandを使用した変数参照](#dotenv-expandを使用した変数参照)
  - [モード別の環境変数分離](#モード別の環境変数分離)
  - [HTML内での環境変数使用](#html内での環境変数使用)
- [9. トラブルシューティングとFAQ](#9-トラブルシューティングとfaq)
  - [よくある問題と解決法](#よくある問題と解決法)
  - [環境変数関連のデバッグ手法](#環境変数関連のデバッグ手法)
- [10. 推奨プラクティスチェックリスト](#10-推奨プラクティスチェックリスト)
- [11. プロジェクト依存ライブラリのバージョン情報](#11-プロジェクト依存ライブラリのバージョン情報)

> **関連ドキュメント**
>
> - [ロガー使用ガイドライン](./logger_usage_guidelines.md) - ログレベル設定用の環境変数の活用方法
> - [コード最適化ガイドライン](./code_optimization_guidelines.md) - 環境に応じた最適化設定
> - [Google Maps ガイドライン](./google_maps_guidelines/index.md) - Google Maps API キー管理

## 1. 基本理念

### 環境変数を使用する目的

環境変数は、アプリケーション設定を外部化してコードから分離させる手法です。これにより、同じコードベースを異なる環境（開発、テスト、本番など）で実行しても、環境ごとに適切な設定で動作させることが可能になります。

### セキュリティとコード分離の重要性

- **セキュリティの確保**: APIキーやシークレットなどの機密情報をコード内にハードコーディングせず、漏洩リスクを低減
- **コード分離**: 環境固有の値をコードから分離することで、環境間の移行がスムーズに
- **柔軟な設定変更**: デプロイのたびにコードを変更する必要なく、設定を変更可能

## 2. Viteでの環境変数の基本

### 環境変数の動作原理

Viteでは環境変数は `import.meta.env` オブジェクトを通じてクライアントコードに公開されます。セキュリティ上の理由から、`VITE_` プレフィックスを持つ変数のみが自動的にクライアントコードに公開されます。

### 環境変数ファイルの優先順位

1. `.env.${mode}.local` (最高優先度、gitignore対象)
2. `.env.${mode}`
3. `.env.local` (gitignore対象)
4. .env (最低優先度)

ここで `${mode}` は現在の実行モード（`development`, `production`, `test` など）を表します。

### 環境変数の型と変換

Viteの環境変数はすべて文字列として扱われます。数値やブール値として使用する場合は、明示的な型変換が必要です。

```typescript
// 数値への変換例
const maxCount = parseInt(import.meta.env.VITE_MAX_COUNT, 10) || 100;

// ブール値への変換例
const isFeatureEnabled = import.meta.env.VITE_FEATURE_FLAG === 'true';
```

## 3. 環境変数の分類と設計

### 主要な環境変数カテゴリ

1. **APIキーと認証情報**

   ```typescript
   VITE_GOOGLE_API_KEY = your - api - key;
   VITE_GOOGLE_MAPS_MAP_ID = your - map - id;
   ```

2. **機能フラグとアプリケーション設定**

   ```typescript
   VITE_ENABLE_MARKER_CLUSTERING = true;
   VITE_MAX_MARKERS = 1000;
   ```

3. **エンドポイントとURL**

   ```typescript
   VITE_API_BASE_URL=https://api.example.com/v1
   ```

4. **ロギングとデバッグ設定**
   ```typescript
   VITE_LOG_LEVEL = info;
   ```

### 命名規則とベストプラクティス

- **環境変数の命名**: スネークケースを使用し、すべて大文字で記述（例: `VITE_API_BASE_URL`）
- **プレフィックスの活用**: 関連する変数をグループ化するプレフィックスを使用
- **適切な説明文**: 各変数に説明コメントを付ける

```typescript
# .env.example
# Google Maps API設定
VITE_GOOGLE_API_KEY=your-api-key  # Google MapsのAPIキー
VITE_GOOGLE_MAPS_MAP_ID=your-map-id  # カスタムマップスタイル用のID

# アプリケーション設定
VITE_MAX_MARKERS=1000  # 地図上に表示する最大マーカー数
```

## 4. 環境ごとの管理戦略

### 単一の.envファイルでの環境管理

現在のプロジェクトでは、複数の.envファイル（.env.development, .env.production, .env.testなど）は使用せず、単一の.envファイルのみを使用しています。

```typescript
# .env
VITE_GOOGLE_API_KEY=your-api-key
VITE_LOG_LEVEL=info
VITE_ENABLE_MOCK_DATA=false
# 必要に応じて他の設定も追加
```

各種環境での設定の切り替えは、必要に応じて手動で.envファイルの値を更新するか、NODE_ENV環境変数に基づいてアプリケーション内部でロジックを分岐させることで対応します。

### 環境別の設定管理

```typescript
# .env.production
VITE_LOG_LEVEL=warn
# APIキーなどの機密情報はCI/CDシステムから注入
```

本番環境では機密情報は`.env`ファイルに直接書かずに、CI/CDシステムのシークレット機能から注入するのが安全です。

### サンプル設定ファイルの提供

新しく開発に参加する開発者のために、`.env.example`ファイルを用意しておくことで、必要な環境変数を一目で理解できるようにします。

```typescript
# .env.example
# 必須設定
VITE_GOOGLE_API_KEY=your-api-key
VITE_API_BASE_URL=https://api.example.com/v1

# オプション設定
VITE_LOG_LEVEL=info  # debug, info, warn, error
VITE_ENABLE_MOCK_DATA=false
```

## 5. 実装のベストプラクティス

### 環境変数アクセスの一元管理

環境変数へのアクセスを一元管理するモジュールを作成することで、型安全性の確保やデフォルト値の適用、必須チェックなどを統一的に行えます。

```typescript
// src/utils/env.ts

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

// 共通の環境変数アクセサ
export const env = {
  googleMapsApiKey: () =>
    getEnvVar({ key: 'VITE_GOOGLE_API_KEY', required: true }),

  apiBaseUrl: () =>
    getEnvVar({
      key: 'VITE_API_BASE_URL',
      defaultValue: 'https://api.default-url.com',
    }),

  logLevel: () =>
    getEnvVar({
      key: 'VITE_LOG_LEVEL',
      defaultValue: 'info',
    }),

  maxMarkers: () =>
    getEnvVar({
      key: 'VITE_MAX_MARKERS',
      defaultValue: 1000,
      transform: value => parseInt(value, 10),
    }),

  isFeatureEnabled: (featureName: string) =>
    getEnvVar({
      key: `VITE_ENABLE_${featureName.toUpperCase()}`,
      defaultValue: false,
      transform: value => value.toLowerCase() === 'true',
    }),

  isDev: () => import.meta.env.DEV,
  isProd: () => import.meta.env.PROD,
};
```

### バリデーションと早期エラー検出

アプリケーション起動時に必須環境変数が適切に設定されているか検証することで、不完全な設定による問題を早期に検出できます。

```typescript
// 環境変数検証の例
export function validateEnvironment(): void {
  try {
    // 必須環境変数を検証
    const requiredVars = ['VITE_GOOGLE_API_KEY', 'VITE_API_BASE_URL'];

    for (const varName of requiredVars) {
      getEnvVar({ key: varName, required: true });
    }

    // 追加の検証（値の形式など）
    const apiUrl = env.apiBaseUrl();
    if (!apiUrl.startsWith('https://') && env.isProd()) {
      throw new Error('本番環境ではAPIエンドポイントにhttpsが必要です');
    }

    logger.info('環境変数の検証に成功しました');
  } catch (error) {
    logger.error('環境変数の検証に失敗しました:', error);
    throw error; // アプリケーション起動を中止
  }
}
```

### TypeScriptでの型定義

TypeScriptでIntelliSenseによる入力補完を有効にするために、環境変数の型定義を行います。

```typescript
// src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  readonly VITE_MAX_MARKERS?: string;
  readonly VITE_ENABLE_MOCK_DATA?: string;
  // 他の環境変数も追加
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## 6. セキュリティ考慮事項

### 機密情報の保護手法

機密情報を含む環境変数ファイルはバージョン管理システムに決して含めないようにします。

```typescript
# .gitignore
.env
.env.local
.env.*.local
```

### 環境変数値のサニタイズ

環境変数から取得した値をHTMLに直接挿入する場合は、XSS攻撃を防ぐためにサニタイズ処理を行うべきです。

```typescript
// 環境変数の安全な使用例
function renderApiEndpoint() {
  const apiUrl = env.apiBaseUrl();
  const sanitizedUrl = sanitizeHtml(apiUrl);
  document.getElementById('api-endpoint').textContent = sanitizedUrl;
}
```

### API制限設定のベストプラクティス

Google MapsなどのAPIキーを使用する場合は、以下の制限設定を検討してください：

- **リファラー制限**: 特定のドメインからのみアクセスを許可
- **APIキーの権限制限**: 必要な機能のみに権限を限定
- **使用量制限**: 1日あたりの使用回数に制限を設定
- **監視とアラート**: 異常な使用パターンを検出するアラート設定

### CI/CDでのシークレット管理

GitHub ActionsやCircle CIなどのCI/CDシステムでは、シークレット機能を使用して機密性の高い環境変数を安全に管理します。

```yaml
# GitHub Actionsの例 (.github/workflows/deploy.yml)
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build with secrets
        env:
          VITE_GOOGLE_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
        run: npm run build
```

## 7. 佐渡で食えっちゃプロジェクト固有の実装

### 必須環境変数

```typescript
// 主要な環境変数
export function validateSadoProjectEnv() {
  const requiredVars = [
    'VITE_GOOGLE_API_KEY',
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

## 8. 環境変数の高度な使用法

### dotenv-expandを使用した変数参照

環境変数の値内で他の環境変数を参照したい場合は、dotenv-expandを使用します。

```typescript
# .env
API_HOST=api.example.com
API_PROTOCOL=https
VITE_API_BASE_URL=${API_PROTOCOL}://${API_HOST}/v1
```

dotenv-expandの設定:

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import dotenvExpand from 'dotenv-expand';

export default defineConfig(({ mode }) => {
  // 環境変数を読み込み
  const env = loadEnv(mode, process.cwd(), '');
  // dotenv-expandで変数展開を処理
  dotenvExpand.expand({ parsed: env });

  return {
    // 設定...
  };
});
```

### モード別の環境変数分離

Viteではコマンドライン引数 `--mode` を使って異なる環境変数セットを読み込めます。これを利用して本番環境のバリエーション（例：本番とステージングなど）を分けることができます。

```bash
# package.jsonの例
"scripts": {
  "build:prod": "vite build --mode production",
  "build:staging": "vite build --mode staging"
}
```

```typescript
# .env.staging
VITE_API_BASE_URL=https://staging-api.example.com/v1
VITE_ENABLE_BETA_FEATURES=true
```

### HTML内での環境変数使用

HTML内で環境変数を直接参照するには、特殊な構文を使用します：

```html
<!-- index.html -->
<link rel="icon" href="%VITE_APP_FAVICON_PATH%" />
<meta name="api-base" content="%VITE_API_BASE_URL%" />
```

## 9. トラブルシューティングとFAQ

### よくある問題と解決法

#### 問題：環境変数が読み込まれない

- .envファイルの位置を確認（プロジェクトルート）
- `VITE_`プレフィックスの確認
- サーバー再起動の実行（変更は起動時にのみ読み込まれる）
- CIパイプラインでの環境変数設定確認

#### 問題：TypeScriptでの型エラー

- env.d.tsファイルで型定義が正しく行われているか確認
- ImportMetaEnvインターフェースに必要な変数が含まれているか確認

#### 問題：本番ビルドで環境変数が含まれない

- `VITE_`プレフィックスの有無を確認
- ビルド時に適切な環境ファイルが読み込まれているか確認
- CIシステムでの環境変数設定を確認

### 環境変数関連のデバッグ手法

```typescript
// 開発環境での環境変数確認
function debugEnvVariables(): void {
  if (!import.meta.env.DEV) return;
  logger.debug('現在の環境変数:', {
    // 機密情報はマスク処理
    GOOGLE_API_KEY: maskKey(
      getEnvVar({
        key: 'VITE_GOOGLE_API_KEY',
        defaultValue: '',
      })
    ),
    LOG_LEVEL: getEnvVar({
      key: 'VITE_LOG_LEVEL',
      defaultValue: 'info',
    }),
    MODE: import.meta.env.MODE,
    BASE_URL: import.meta.env.BASE_URL,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });
}

// 機密情報のマスク処理
function maskKey(key: string): string {
  if (!key) return '[未設定]';
  if (key.length <= 8) return '********';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}
```

## 10. 推奨プラクティスチェックリスト

### 環境設定の基本

- [x] **環境ファイルの分離**: .env, `.env.development`, `.env.production`, `.env.test`
- [x] **サンプル設定**: 新規開発者向けに`.env.example`を提供
- [x] **環境別の最適化**: 開発/テスト/本番環境に適した設定

### セキュリティ対策

- [x] **機密情報の保護**: .gitignoreに.envファイルを追加
- [x] **API制限設定**: Google Maps APIキーなどに適切な制限
- [x] **秘匿値の保護**: ログ出力時の機密情報マスク処理

### 実装品質

- [x] **型安全なアクセス**: `getEnvVar`関数による型安全なアクセス
- [x] **バリデーション**: アプリ起動時に必須環境変数を検証
- [x] **明確な命名規則**: 一貫した命名規則の使用
- [x] **変数展開のサポート**: dotenv-expandによる変数参照

> **重要**: 環境変数の設定は、アプリケーションの動作や安全性に直接影響します。特に本番環境へのデプロイ前には、すべての項目を再確認してください。

## 11. プロジェクト依存ライブラリのバージョン情報

このセクションでは、「佐渡で食えっちゃ」プロジェクトで使用されている主要なライブラリやツールのバージョン情報を示します。関連するドキュメント間で技術スタックの一貫性を確保するために参照してください。

### フレームワークとビルドツール

| ライブラリ/ツール | バージョン | 使用目的         |
| ----------------- | ---------- | ---------------- |
| React             | 19.0.0     | UIライブラリ     |
| TypeScript        | 5.4.0      | 静的型付け言語   |
| Vite              | 5.0.0      | ビルドツール     |
| Vitest            | 1.1.0      | テストライブラリ |

### 状態管理とデータフェッチング

| ライブラリ     | バージョン | 使用目的           |
| -------------- | ---------- | ------------------ |
| Zustand        | 4.4.0      | 状態管理ライブラリ |
| TanStack Query | 5.8.4      | データフェッチング |

### マップ関連ライブラリ

| ライブラリ                  | バージョン | 使用目的               |
| --------------------------- | ---------- | ---------------------- |
| Google Maps JavaScript API  | v3.54      | 地図表示基盤           |
| @googlemaps/markerclusterer | 2.5.1      | マーカークラスタリング |

### ユーティリティとスタイリング

| ライブラリ   | バージョン | 使用目的                    |
| ------------ | ---------- | --------------------------- |
| Tailwind CSS | 3.4.0      | ユーティリティファーストCSS |
| EmotionJS    | 11.11.0    | CSSインJS                   |
| twin.macro   | 3.4.0      | TailwindとEmotionの連携     |

> **注意**: ライブラリのバージョンはプロジェクト進行に伴い更新される可能性があります。package.jsonで最新のバージョンを確認してください。

### バージョン更新のガイドライン

プロジェクトの依存関係を更新する際は、以下のガイドラインに従ってください ：

1. **セマンティックバージョニング**: パッチ更新（例：5.0.0→5.0.1）は自由に、マイナー更新（例：5.0.0→5.1.0）は影響範囲を確認後に、メジャー更新（例：5.0.0→6.0.0）はチーム全体で検討後に行う
2. **環境変数への影響**: 更新によって環境変数の扱いが変わる場合は、env_usage_guidelines.mdを更新する
3. **ロギングへの影響**: ロギングメカニズムに影響がある場合は、logger_usage_guidelines.mdを更新する
4. **最適化戦略への影響**: パフォーマンスや最適化に影響がある場合は、code_optimization_guidelines.mdを更新する

> **関連ガイドライン**:
>
> - コード最適化ガイドライン - 効率的なビルド設定や依存関係の最適化
> - ロガー使用ガイドライン - 環境変数を活用したログレベル設定
>
> **参考リンク**：
>
> - [Vite環境変数公式ドキュメント](https://ja.vitejs.dev/guide/env-and-mode.html) - Viteでの環境変数の基本的な使い方
> - [TypeScriptでの環境変数型定義](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html) - 型安全な環境変数の実装方法
> - [Google Mapsプラットフォーム認証ガイド](https://developers.google.com/maps/documentation/javascript/get-api-key) - APIキーの取得と設定方法
> - [dotenv-expand](https://github.com/motdotla/dotenv-expand) - 環境変数内での変数参照実装
> - [環境変数のセキュリティベストプラクティス](https://docs.github.com/ja/actions/security-guides/encrypted-secrets) - GitHub Actionsでのシークレット管理
> - [Viteの.envタイプ定義](https://vitejs.dev/guide/env-and-mode.html#intellisense-for-typescript) - VSCodeでのIntelliSenseサポート
