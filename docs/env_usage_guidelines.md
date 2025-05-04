# 環境変数管理ガイドライン

> **最終更新日**: 2025年4月17日  
> **バージョン**: 1.4.0  
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
- [12. 参考リンク](#12-参考リンク)
  - [公式ドキュメント](#公式ドキュメント)
  - [セキュリティと認証](#セキュリティと認証)
  - [その他のツールと実装](#その他のツールと実装)

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

### 環境変数ファイル構造

佐渡で食えっちゃプロジェクトでは、複数の環境変数ファイルを使用して各環境に最適な設定を提供します。現在の構造は次の通りです：

```
.env                # 共通の基本設定（すべての環境で使用）
.env.development    # 開発環境固有の設定
.env.test           # テスト環境固有の設定
.env.production     # 本番環境固有の設定
.env.local          # ローカル環境のみの設定（Gitで共有されない）
.env.*.local        # 特定環境のローカル設定（Gitで共有されない）
.env.example        # 環境変数カタログ（すべての変数の説明と例）
```

### 環境別の最適化設定

各環境ごとに最適化された設定を提供することで、開発・テスト・本番それぞれで最適なパフォーマンスと機能を実現します。

#### 開発環境（`.env.development`）

```bash
# 開発環境の特徴
VITE_LOG_LEVEL=debug
VITE_DEBUG_MODE=true
VITE_MEASURE_MAP_PERFORMANCE=true
VITE_GOOGLE_API_KEY_RESTRICTIONS=false
```

開発環境では、詳細なログ出力やデバッグ機能を有効にし、開発者の作業効率を最大化します。

#### テスト環境（`.env.test`）

```bash
# テスト環境の特徴
VITE_LOG_LEVEL=error
VITE_DEBUG_MODE=false
VITE_PRELOAD_POI_DATA=true
```

テスト環境では、テスト結果の安定性と一貫性を重視し、不要なログ出力を抑制します。

#### 本番環境（`.env.production`）

```bash
# 本番環境の特徴
VITE_LOG_LEVEL=error
VITE_DEBUG_MODE=false
VITE_DROP_CONSOLE=true
VITE_OPTIMIZE_MAPS=true
VITE_MAP_LAZY_LOAD=true
VITE_ENABLE_COMPRESSION=true
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true
VITE_GOOGLE_API_KEY_RESTRICTIONS=true
```

本番環境では、パフォーマンスとセキュリティを最優先し、すべての最適化設定を有効にします。

### サンプル設定ファイルの提供

新しく開発に参加する開発者のために、包括的な`.env.example`ファイルを用意しています。このファイルは環境変数カタログとして機能し、すべての利用可能な変数、その役割、型情報、使用可能な値を一目で理解できるようにしています。

```bash
# =============================================================================
# 佐渡で食えっちゃ - 環境変数設定カタログ
# =============================================================================

# ===== Google Maps API設定 =====
VITE_GOOGLE_API_KEY=your_google_api_key_here           # Google Maps APIキー (string)
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here               # カスタムマップスタイル用のID (string)
VITE_GOOGLE_MAPS_VERSION=weekly                        # API読み込みバージョン (string: 'weekly'|'quarterly'|'beta')
VITE_GOOGLE_MAPS_LIBRARIES=places,marker               # 読み込むライブラリ (string: カンマ区切り)
VITE_GOOGLE_API_KEY_RESTRICTIONS=false                 # APIキー制限の有効化 (boolean as string)

# ===== ロギング設定 =====
VITE_LOG_LEVEL=info                                    # ログレベル (string: 'debug'|'info'|'warn'|'error')
VITE_DEBUG_MODE=false                                  # デバッグモード (boolean as string)

# ===== 機能フラグ設定 =====
VITE_ENABLE_MARKER_CLUSTERING=true                     # マーカークラスタリング (boolean as string)
VITE_OPTIMIZE_MAPS=false                               # 地図最適化モード (boolean as string)
```

このカタログには、各変数の詳細な説明とデータ型情報が含まれており、新しい開発者が迅速に環境設定を理解し、適切な値を設定できるようになっています。

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

機密情報を含む環境変数ファイルはバージョン管理システムに決して含めないようにします。特に、APIキーやサービス認証情報は常に保護する必要があります。

```bash
# .gitignore
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local
```

当プロジェクトでは、機密情報の取り扱いに関する明確なルールを設けています：

1. **共有リポジトリ用ファイル**：`.env`, `.env.development`, `.env.test`, `.env.production`, `.env.example` には機密情報を含めません
2. **ローカル開発用ファイル**：APIキーなどの機密情報は `.env.local` または `.env.*.local` ファイルに保存します
3. **値の分離**：
   - `.env` - 共通の非機密設定（バージョン情報、フラグなど）
   - `.env.local` - 開発者固有の機密情報（APIキーなど）

特に重要なのは、GoogleマップAPIキーやEmailJSの認証情報など、悪用される可能性のある情報の管理です：

```bash
# .env.local の例（Gitで共有されない）
VITE_GOOGLE_API_KEY=AIza...  # 実際のAPIキー
VITE_EMAILJS_SERVICE_ID=service_xxx  # EmailJSサービスID
VITE_EMAILJS_TEMPLATE_ID=template_xxx  # EmailJSテンプレートID
VITE_EMAILJS_PUBLIC_KEY=xxx  # EmailJS公開キー
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

GitHub Pages へのデプロイ時は、GitHub Actions のシークレット機能を使用して機密性の高い環境変数を安全に管理します。佐渡で食えっちゃプロジェクトでは、本番環境向けの環境変数を以下のように管理しています。

```yaml
# GitHub Actionsの例 (.github/workflows/deploy-to-gh-pages.yml)
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'

      - name: Install dependencies
        run: npm ci

      - name: Build with secrets
        env:
          VITE_GOOGLE_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
          VITE_GOOGLE_MAPS_MAP_ID: ${{ secrets.GOOGLE_MAPS_MAP_ID }}
          VITE_EMAILJS_SERVICE_ID: ${{ secrets.EMAILJS_SERVICE_ID }}
          VITE_EMAILJS_TEMPLATE_ID: ${{ secrets.EMAILJS_TEMPLATE_ID }}
          VITE_EMAILJS_PUBLIC_KEY: ${{ secrets.EMAILJS_PUBLIC_KEY }}
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
```

このように設定することで：

1. 機密情報をGitHubリポジトリ内のコードに含めない
2. デプロイプロセス中のみ安全に環境変数を注入
3. 本番ビルドに必要なすべての環境変数を統一的に管理

なお、GitHub Secretsは組織またはリポジトリの設定画面から管理できます。

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

- [x] **環境変数ファイル構造の整備**:
  - `.env` - 共通の基本設定（すべての環境で使用）
  - `.env.development` - 開発環境固有の設定
  - `.env.test` - テスト環境固有の設定
  - `.env.production` - 本番環境固有の設定
  - `.env.local` - ローカル環境のみの機密設定（Gitで共有されない）
  - `.env.example` - 包括的な環境変数カタログ（例と説明）
- [x] **型情報の付与**: すべての環境変数に型情報をコメントで付与
- [x] **セクション分け**: 関連する変数をカテゴリごとに明確に分類

### 環境別の最適化

- [x] **開発環境**: デバッグ機能を有効化、詳細ログ、開発者体験の向上
  ```bash
  VITE_LOG_LEVEL=debug
  VITE_DEBUG_MODE=true
  VITE_MEASURE_MAP_PERFORMANCE=true
  ```
- [x] **テスト環境**: 安定性と一貫性を重視、不要なログの抑制
  ```bash
  VITE_LOG_LEVEL=error
  VITE_PRELOAD_POI_DATA=true
  ```
- [x] **本番環境**: パフォーマンスとセキュリティを最大化
  ```bash
  VITE_OPTIMIZE_MAPS=true
  VITE_ENABLE_COMPRESSION=true
  VITE_DROP_CONSOLE=true
  ```

### セキュリティ対策

- [x] **機密情報の分離**:
  - APIキーなどの機密情報は `.env.local` または `.env.*.local` に保存
  - GitHubリポジトリには機密情報を含まない
- [x] **CI/CD統合**:
  - GitHub Actions で Secrets を使用して本番デプロイ時に環境変数を注入
  - API制限の有効化（本番環境のみ）: `VITE_GOOGLE_API_KEY_RESTRICTIONS=true`
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

## 12. 参考リンク

### 公式ドキュメント

- [Vite環境変数公式ドキュメント](https://ja.vitejs.dev/guide/env-and-mode.html) - Viteでの環境変数の基本的な使い方
- [TypeScriptでの環境変数型定義](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html) - 型安全な環境変数の実装方法
- [Viteの.envタイプ定義](https://vitejs.dev/guide/env-and-mode.html#intellisense-for-typescript) - VSCodeでのIntelliSenseサポート

### セキュリティと認証

- [Google Mapsプラットフォーム認証ガイド](https://developers.google.com/maps/documentation/javascript/get-api-key) - APIキーの取得と設定方法
- [環境変数のセキュリティベストプラクティス](https://docs.github.com/ja/actions/security-guides/encrypted-secrets) - GitHub Actionsでのシークレット管理

### その他のツールと実装

- [dotenv-expand](https://github.com/motdotla/dotenv-expand) - 環境変数内での変数参照実装

> **関連ガイドライン**:
>
> - [コード最適化ガイドライン](./code_optimization_guidelines.md) - 効率的なビルド設定や依存関係の最適化
> - [ロガー使用ガイドライン](./logger_usage_guidelines.md) - 環境変数を活用したログレベル設定
