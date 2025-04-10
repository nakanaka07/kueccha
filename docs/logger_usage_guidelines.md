```markdown
# ロガー使用ガイドライン

> **最終更新日**: 2025年4月10日  
> **バージョン**: 1.2.0  
> **作成者**: 佐渡で食えっちゃプロジェクトチーム

## 目次

- [1. ロギングの基本原則](#1-ロギングの基本原則)
  - [ロガー導入の目的と利点](#ロガー導入の目的と利点)
  - [logger.tsの機能概要](#loggerts機能概要)
  - [型定義](#型定義)
- [2. ログレベルと使用シナリオ](#2-ログレベルと使用シナリオ)
  - [ログレベルの概要](#ログレベルの概要)
  - [適切なログレベル選択の基準](#適切なログレベル選択の基準)
- [3. 構造化ログとコンテキスト情報](#3-構造化ログとコンテキスト情報)
  - [LogContext インターフェース](#logcontext-インターフェース)
  - [構造化ロギングの長期的メリット](#構造化ロギングの長期的メリット)
  - [効果的なコンテキスト追加方法](#効果的なコンテキスト追加方法)
  - [推奨コンテキスト項目](#推奨コンテキスト項目)
  - [プライバシーとセキュリティ考慮事項](#プライバシーとセキュリティ考慮事項)
  - [ログのセキュリティ考慮事項](#ログのセキュリティ考慮事項owaspガイドラインより)
- [4. パフォーマンス測定とロギング](#4-パフォーマンス測定とロギング)
  - [処理時間の自動測定](#処理時間の自動測定)
  - [パフォーマンスモニタリングのベストプラクティス](#パフォーマンスモニタリングのベストプラクティス)
  - [非同期処理のエラーハンドリング](#非同期処理のエラーハンドリング)
- [5. 条件付きロギングと最適化](#5-条件付きロギングと最適化)
  - [条件付きログ出力](#条件付きログ出力)
  - [ロギングのパフォーマンス最適化](#ロギングのパフォーマンス最適化)
- [6. 環境別ロギング設定](#6-環境別ロギング設定)
  - [開発環境での詳細ログ](#開発環境での詳細ログ)
  - [本番環境でのセキュアなロギング](#本番環境でのセキュアなロギング)
  - [環境変数によるログ設定の制御](#環境変数によるログ設定の制御)
- [7. 高度なロギング機能](#7-高度なロギング機能)
  - [テスト環境でのログバッファ活用](#テスト環境でのログバッファ活用)
  - [Jestを使用したロガー関数のテスト手法](#jestを使用したロガー関数のテスト手法)
  - [セキュリティとプライバシーの設計パターン](#セキュリティとプライバシーの設計パターン)
  - [トレーシング識別子の活用](#トレーシング識別子の活用)
- [8. まとめと推奨プラクティス](#8-まとめと推奨プラクティス)
  - [ロギングのベストプラクティスチェックリスト](#ロギングのベストプラクティスチェックリスト)
- [参考リンク](#参考リンク)

> **関連ドキュメント**
> - [環境変数管理ガイドライン](./env_usage_guidelines.md) - ロギング設定用の環境変数管理
> - [コード最適化ガイドライン](./code_optimization_guidelines.md) - パフォーマンス計測とロギングの統合

## 1. ロギングの基本原則

### ロガー導入の目的と利点

ロギング機能は、アプリケーションの動作を監視し、問題の早期発見や診断を可能にします。「佐渡で食えっちゃ」プロジェクトでは、効率的なデバッグ、パフォーマンス監視、エラー追跡のためにロギング機能を提供しています。

### logger.tsの機能概要

- 複数ログレベル（ERROR, WARN, INFO, DEBUG）のサポート
- 構造化されたコンテキスト情報の記録
- 処理時間の自動計測
- 環境別のログ設定
- 外部サービスとの連携可能性

```typescript
// 基本的な使用例
import { logger } from '@/utils/logger';
logger.info('アプリケーション初期化完了', { version: '1.0.0' });
```

### 型定義

```typescript
// ログレベルの型定義
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// LogLevel型を文字列リテラル型として使用することも可能
export type LogLevelString = 'error' | 'warn' | 'info' | 'debug';

// LogContext インターフェース
export interface LogContext {
  [key: string]: unknown; // 任意のプロパティを許容
  component?: string; // コンポーネント名
  userId?: string; // ユーザーID
  requestId?: string; // リクエスト識別子
}
```

## 2. ログレベルと使用シナリオ

### ログレベルの概要

| ログレベル | 定義値    | 用途                                 | 環境               |
| ---------- | --------- | ------------------------------------ | ------------------ |
| ERROR      | `'error'` | 致命的な問題、例外、回復不能なエラー | すべての環境       |
| WARN       | `'warn'`  | 潜在的な問題、非推奨機能の使用       | すべての環境       |
| INFO       | `'info'`  | 一般的な操作情報、状態変化           | 開発・ステージング |
| DEBUG      | `'debug'` | 詳細なデバッグ情報                   | 主に開発環境       |

### 適切なログレベル選択の基準

- **ERROR**: システムが機能を提供できない状況
- **WARN**: 正常動作は継続可能だが注意が必要な状況
- **INFO**: 重要な操作の開始・完了や状態変化
- **DEBUG**: 問題解決のための詳細情報

```typescript
// ログレベル使用例
// エラーログ - 回復不能な問題
logger.error('APIからのデータ取得に失敗しました', error);

// 警告ログ - 代替手段を使用
logger.warn('最新データの取得に失敗しました。キャッシュを使用します', {
  cacheAge: '30分',
  retryIn: '5分後',
});

// 情報ログ - 重要な操作
logger.info('ユーザーがマップビューを変更しました', {
  center: { lat: 38.048, lng: 138.409 },
  zoom: 12,
});

// デバッグログ - 開発時の詳細情報
logger.debug('POIデータ詳細', {
  pointCount: 156,
  categories: ['飲食', '観光', '宿泊'],
});
```

## 3. 構造化ログとコンテキスト情報

### LogContext インターフェース

```typescript
// LogContext インターフェース
export interface LogContext {
  [key: string]: unknown; // 任意のプロパティを許容
  component?: string; // コンポーネント名
  userId?: string; // ユーザーID
  requestId?: string; // リクエスト識別子
}
```

### 構造化ロギングの長期的メリット

構造化ロギングを採用することで得られる具体的なメリットとして：

- **検索性の向上**: JSONフォーマットなどで統一されたログ形式により、特定の条件でのフィルタリングが容易になる
- **システム連携の効率化**: 監視システムやアラート機能と簡単に連携できる
- **パターン認識の容易さ**: 構造化されたデータを分析ツールで処理することで、問題パターンの早期発見が可能
- **コンテキスト伝達**: トレースIDなどの識別子を常に含めることで、複数サービス間の関連処理を追跡できる

### 効果的なコンテキスト追加方法

```typescript
// 基本的なコンテキスト
logger.info('マップデータを読み込みました', {
  component: 'MapContainer', // コンポーネント名を指定
  pointCount: points.length,
  region: 'sado-island',
  loadTimeMs: 342,
});

// エラーオブジェクトを直接渡す - 型安全なエラーハンドリング
try {
  await fetchData();
} catch (error: unknown) {
  // TypeScript 4.0以降では、catch節のerrorはunknown型になるため
  // 型チェックを行ってから使用するのが安全
  if (error instanceof Error) {
    logger.error('データ取得失敗', error); // Error オブジェクトはスタックトレースも自動的に含まれます
  } else {
    // errorが非標準のエラーオブジェクトの場合
    logger.error('データ取得失敗', { message: String(error) });
  }
}
```

### 推奨コンテキスト項目

| コンテキスト項目 | 説明                           | 例                                    |
| ---------------- | ------------------------------ | ------------------------------------- |
| component        | ログを出力したコンポーネント名 | `'MapContainer'`, `'POIService'`      |
| action           | 実行中の操作種別               | `'data_fetch'`, `'user_filter'`       |
| entityId         | 関連するデータのID             | POIのID、ユーザーIDなど               |
| durationMs       | 処理時間（ミリ秒）             | `measureTime` で自動計測される値      |
| status           | 処理結果のステータス           | `'success'`, `'failure'`, `'partial'` |

### プライバシーとセキュリティ考慮事項

- 個人識別情報（PII）をログに記録しない
- パスワード、トークン、APIキーをログに含めない
- 必要な場合は情報を一部マスキングする

```typescript
// センシティブ情報のマスキング例
// any型を避け、ジェネリック型パラメータを使用して型安全性を向上
const maskSensitiveData = <T extends Record<string, unknown>>(data: T): T => {
  const result = { ...data };
  const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'email'] as const;
  
  SENSITIVE_FIELDS.forEach(field => {
    if (field in result) {
      // 型ガードを使用して型安全なマスキング
      if (typeof result[field] === 'string') {
        result[field] = (result[field] as string).substring(0, 2) + '****';
      } else {
        result[field] = '[masked]';
      }
    }
  });
  
  return result;
};

logger.info('API認証', maskSensitiveData({
  endpoint: '/api/auth',
  email: 'user@example.com',
  token: 'abc123xyz',
}));
// 出力: { endpoint: '/api/auth', email: 'us****', token: 'ab****' }
```

### ログのセキュリティ考慮事項（OWASPガイドラインより）

ログ自体を保護するための具体的な方法：

- **ログのアクセス制御**: ログを閲覧・操作できる権限を適切に制限する
- **ログの完全性保護**: ログの改ざんを検知できる仕組みを導入する
- **ログの長期保存と検索性**: コンプライアンス要件に応じた適切な保存期間を設定する
- **ログから除外すべき情報**:
  - フルセッションID（切り詰められたIDのみ記録）
  - 認証情報（パスワード、トークンなど）
  - 個人識別情報（未マスクのメールアドレスなど）
  - 機密性の高い商取引データ
  - 医療情報
  - 規制対象の個人情報

## 4. パフォーマンス測定とロギング

### 処理時間の自動測定

```typescript
/**
 * 同期処理の実行時間を測定し、結果を返す型安全な関数
 * @template T 関数の戻り値の型
 */
function measureTime<T>(
  label: string,
  fn: () => T,
  level: LogLevel = LogLevel.INFO,
  context?: LogContext,
  thresholdMs?: number
): T;

/**
 * 非同期処理の実行時間を測定し、結果を返す型安全な関数
 * @template T 非同期関数の解決値の型
 */
function measureTimeAsync<T>(
  label: string,
  fn: () => Promise<T>,
  level: LogLevel = LogLevel.INFO,
  context?: LogContext,
  thresholdMs?: number
): Promise<T>;

// 使用例
// 同期処理の実行時間を測定（戻り値の型が推論される）
const result = logger.measureTime(
  'POIデータのフィルタリング',
  () => filterPOIData(rawData),
  LogLevel.INFO,
  { dataSize: rawData.length }
);

// 非同期処理の実行時間を測定（戻り値の型が推論される）
const data = await logger.measureTimeAsync(
  'APIからのデータ取得',
  () => fetchPOIData(),
  LogLevel.INFO,
  { endpoint: '/api/pois' },
  100 // 100ms以上かかった場合のみログを出力
);
```

### パフォーマンスモニタリングのベストプラクティス

- 重要な処理の実行時間を常に記録する
- `thresholdMs` パラメータを使用して、特定時間を超える処理のみをログに記録
- パフォーマンス問題の兆候を早期に発見するために定期的にログを分析する

### 非同期処理のエラーハンドリング

```typescript
try {
  const result = await logger.measureTimeAsync(
    'POIデータの読み込み',
    async () => {
      const response = await fetch('/api/pois');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    },
    LogLevel.INFO
  );
  return result;
} catch (error) {
  // エラーは既にlogger.errorで記録されているため、
  // ここでは追加のコンテキスト情報のみを記録
  logger.info('POIデータ読み込み失敗の追加情報', {
    retry: true,
    fallbackAvailable: hasCachedData(),
  });
  return getBackupData();
}
```

## 5. 条件付きロギングと最適化

### 条件付きログ出力

```typescript
// 条件付きログ出力
logger.logIf(user.isAdmin, LogLevel.INFO, '管理者がダッシュボードにアクセスしました', {
  userId: user.id,
});

// デバッグモードでのみ詳細ログを出力 - 型安全なアクセス
// 環境変数が存在するか、またboolean型かを確認
if (typeof ENV.env.isDev === 'boolean' && ENV.env.isDev) {
  logger.debug('詳細なPOIデータ', poiData);
}
```

### ロギングのパフォーマンス最適化

```typescript
// 1. サンプリングレートを使用して高頻度ログを制限
logger.configure({
  samplingRates: {
    マップ操作: 100, // 100回に1回だけログを記録
    データ更新: 10, // 10回に1回だけログを記録
  },
});

// 2. 大きなデータ構造をログに記録する前に要約
const largeDataSummary = {
  count: largeData.length,
  types: [...new Set(largeData.map(item => item.type))],
  firstItem: largeData[0],
};
logger.debug('大量データの要約', largeDataSummary);
```

## 6. 環境別ロギング設定

### 開発環境での詳細ログ

```typescript
// 開発環境用設定
if (ENV.env.isDev) {
  logger.configure({
    minLevel: LogLevel.DEBUG, // すべてのログレベルを表示
    enableConsole: true, // コンソール出力を有効化
    includeTimestamps: true, // タイムスタンプを表示
    deduplicateErrors: false, // エラーの重複除去を無効化
    
    // 特定コンポーネントのみ詳細ログを取得
    componentLevels: {
      MapContainer: LogLevel.DEBUG, // 地図関連のみデバッグログも表示
      APIClient: LogLevel.INFO, // APIクライアントは情報レベルまで
    },
  });
}
```

### 本番環境でのセキュアなロギング

```typescript
// 本番環境用設定
if (ENV.env.isProd) {
  logger.configure({
    minLevel: LogLevel.WARN, // WARNとERRORのみ表示
    enableConsole: true, // 基本的なエラーログはコンソールにも表示
    deduplicateErrors: true, // 同一エラーの重複を防止
    deduplicationInterval: 3600000, // 1時間（本番環境では長めに設定）
    
    // 高頻度ログの抑制設定
    samplingRates: {
      マップ操作: 50, // マップ操作ログは50回に1回だけ記録
      データ更新: 10, // データ更新ログは10回に1回だけ記録
    },
  });
}
```

### 環境変数によるログ設定の制御

```typescript
// env_usage_guidelines.mdで説明されている環境変数を使用したロガー設定
import { getEnvVar } from '@/utils/env';
import { LogLevel } from '@/utils/logger';

// 環境変数からログレベルを取得する関数
function getLogLevelFromEnv(): LogLevel {
  const logLevelStr = getEnvVar({
    key: 'VITE_LOG_LEVEL',
    defaultValue: 'info'
  }).toLowerCase();
  
  // 文字列を LogLevel に変換
  switch (logLevelStr) {
    case 'debug': return LogLevel.DEBUG;
    case 'info': return LogLevel.INFO;
    case 'warn': return LogLevel.WARN;
    case 'error': return LogLevel.ERROR;
    default: return LogLevel.INFO;
  }
}

// アプリケーション起動時にロガー設定を環境変数に基づいて初期化
export function initializeLogger(): void {
  const logLevel = getLogLevelFromEnv();
  
  logger.configure({
    minLevel: logLevel,
    enableConsole: true,
    includeTimestamps: !ENV.env.isProd, // 本番環境ではタイムスタンプを省略して最適化
    
    // 環境変数で個別のコンポーネントのログレベルを上書き可能
    componentLevels: {
      MapContainer: getEnvVar({
        key: 'VITE_LOG_LEVEL_MAP',
        defaultValue: logLevel,
        transform: str => str.toLowerCase() === 'debug' ? LogLevel.DEBUG :
                           str.toLowerCase() === 'info' ? LogLevel.INFO :
                           str.toLowerCase() === 'warn' ? LogLevel.WARN :
                           LogLevel.ERROR
      })
    }
  });
  
  logger.info('ロガーを初期化しました', {
    component: 'LoggerSystem',
    level: logLevel,
    environment: ENV.env.isProd ? '本番' : ENV.env.isStaging ? 'ステージング' : '開発'
  });
}
```

## 7. 高度なロギング機能

### テスト環境でのログバッファ活用

```typescript
describe('POIフィルター機能テスト', () => {
  beforeEach(() => {
    // テスト前にログをクリア
    logger.getRecentLogs();
  });
  test('無効なデータを適切に処理できること', () => {
    // テスト実行
    filterPOIs(invalidData);

    // エラーログが記録されたか確認
    const logs = logger.getRecentLogs(LogLevel.ERROR);
    expect(logs.some(log => log.message.includes('無効なPOIデータ'))).toBe(true);
    
    // logs配列が空でないことを確認してから要素にアクセス
    expect(logs.length).toBeGreaterThan(0);
    if (logs.length > 0) {
      // Optional Chainingを使って安全にコンテキストのプロパティにアクセス
      expect(logs[0].context?.component).toBe('POIFilter');
    }
  });
});
```

### Jestを使用したロガー関数のテスト手法

```typescript
// ロガーのモックとテスト例
import { logger } from '@/utils/logger';

// ロガーのメソッドをスパイ
jest.spyOn(logger, 'error');
jest.spyOn(logger, 'info');

describe('POIサービスのエラーハンドリング', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });

  test('無効なデータでエラーログが記録されること', async () => {
    // テスト対象の関数実行
    await poiService.process(invalidData);
    
    // エラーログが呼ばれたか確認
    expect(logger.error).toHaveBeenCalledWith(
      '無効なPOIデータ',
      expect.objectContaining({
        component: 'POIService',
        errorCode: 'INVALID_FORMAT'
      })
    );
    
    // 情報ログが呼ばれたか確認
    expect(logger.info).toHaveBeenCalledWith(
      'POI処理試行',
      expect.objectContaining({
        dataCount: expect.any(Number)
      })
    );
  });
});
```

### セキュリティとプライバシーの設計パターン

```typescript
// 位置情報の精度を落とす例
const reduceLocationPrecision = (lat: number, lng: number): [number, number] => {
  // 小数点以下3桁に制限（約100mの精度）
  return [Math.round(lat * 1000) / 1000, Math.round(lng * 1000) / 1000];
};

// 位置情報のマスキング例
const [reducedLat, reducedLng] = reduceLocationPrecision(38.04805, 138.40903);
logger.info('ユーザー位置情報', {
  location: `${reducedLat},${reducedLng}`, // "38.048,138.409"
  accuracy: '約100m',
});
```

### トレーシング識別子の活用

```typescript
// トレース識別子を生成
const generateTraceId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
};

// リクエストごとにトレースIDを生成
const traceId = generateTraceId();

// 全てのログにトレースIDを含める
logger.info('ユーザーリクエスト受信', {
  traceId,
  endpoint: '/api/pois',
  method: 'GET',
});

// 処理完了時もトレースIDを含める
logger.info('ユーザーリクエスト完了', {
  traceId,
  durationMs: performance.now() - startTime,
  status: 'success',
});
```

## 8. まとめと推奨プラクティス

### ロギングのベストプラクティスチェックリスト

#### ログ設計と実装
- [x] **適切なログレベルの使用**: 重要度に応じた適切なログレベルを選択
- [x] **構造化ログ形式**: JSON形式など解析可能な形式でログを出力
- [x] **コンテキスト情報の追加**: 問題診断に役立つコンテキスト情報を含める

#### パフォーマンスと監視
- [x] **パフォーマンス測定**: 重要な操作の実行時間を計測
- [x] **トレーシング対応**: 関連する処理間で識別子を共有

#### セキュリティと環境対応
- [x] **プライバシー保護**: 個人情報や機密情報をマスク処理
- [x] **環境別設定**: 開発・テスト・本番環境に応じたログ設定

> **重要**: ロギングは問題解決の重要なツールですが、過剰なログ出力はパフォーマンスに影響します。目的に応じて適切なログ設計を行ってください。

> **関連ガイドライン**:
> - 環境変数管理ガイドライン - ロギング設定のための環境変数活用
> - コード最適化ガイドライン - パフォーマンス監視とデバッグテクニック

## 参考リンク

### 基本概念
- [MDN Console API](https://developer.mozilla.org/ja/docs/Web/API/Console) - JavaScriptのコンソールAPIリファレンス
- [構造化ロギングの基礎と実践](https://betterstack.com/community/guides/logging/structured-logging/) - 構造化ロギングの重要性と実装方法
- [効果的なロギング戦略](https://blog.appsignal.com/2021/09/01/best-practices-for-logging-in-nodejs.html) - アプリケーションログの設計と活用法

### 実装テクニック
- [Winston/Pino TypeScriptガイド](https://blog.logrocket.com/node-js-logging-best-practices/) - 人気のあるNode.jsロギングライブラリの活用法
- [TypeScriptでの型安全なロガー実装](https://github.com/winstonjs/winston#using-custom-logging-levels) - Winston.jsを使った型安全なロガー構築例 
- [Tslog - TypeScript向け構造化ロガー](https://github.com/fullstack-build/tslog) - 完全にTypeScriptで書かれた構造化ロガー
- [Reactアプリケーションでのロギング実践](https://blog.sentry.io/tracking-errors-in-react-with-sentry/) - Reactプロジェクトにおけるエラーハンドリングとロギング

### セキュリティとプライバシー
- [ロギングにおけるセキュリティベストプラクティス](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) - OWASPによるセキュアなロギングのガイドライン
- [プライバシー保護のためのロギング設計](https://auth0.com/blog/logging-best-practices-gdpr/) - GDPRなどを考慮したプライバシー保護ロギング手法

### テストと監視
- [JavaScriptアプリケーションのロギングベストプラクティス](https://blog.logrocket.com/javascript-logging-best-practices/) - フロントエンドでのロギング手法とツール
- [Jest を使ったロガーのテスト手法](https://www.digitalocean.com/community/tutorials/testing-node-js-applications-with-jest) - ロガー関数のモックと検証
- [Webアプリのパフォーマンスモニタリングとロギング](https://blog.bitsrc.io/performance-monitoring-and-logging-in-the-browser-78550e625e6) - フロントエンドパフォーマンス計測とロギング連携

### クラウドと運用
- [クラウドネイティブなロギングアーキテクチャ](https://aws.amazon.com/jp/blogs/devops/building-a-serverless-log-analytics-solution/) - クラウド環境に適したロギング設計
- [分散システムにおけるトレーシング](https://opentelemetry.io/docs/concepts/signals/traces/) - OpenTelemetryによる分散トレーシングの基礎

### 日本語リソース
- [TypeScriptによるロギングシステムの構築](https://zenn.dev/mizchi/articles/typescript-logging-techniques) - 実践的なTypeScriptロガー構築ガイド
- [フロントエンドのログ設計と実装](https://qiita.com/potato4d/items/5eea220a9a4cdfbd055a) - SPAにおけるログ実装パターン
- [効果的なエラーハンドリングとロギング](https://engineering.linecorp.com/ja/blog/error-handling-and-logging/) - 大規模サービスでのロギング戦略
