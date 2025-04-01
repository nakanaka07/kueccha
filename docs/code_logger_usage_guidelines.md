# ロガー使用ガイドライン

## 1. ロギングの基本原則

### ロガー導入の目的と利点

ロギング機能は、アプリケーションの動作を監視し、問題の早期発見や診断を可能にします。「佐渡で食えっちゃ」プロジェクトでは、効率的なデバッグ、パフォーマンス監視、エラー追跡のためにロギング機能を提供しています。

### プロジェクトにおけるロギングの役割

- 開発時の問題診断と解決の効率化
- 本番環境での問題追跡と原因特定
- パフォーマンスボトルネックの発見
- ユーザー行動の理解とUX改善

### logger.tsの機能概要

プロジェクトで使用する`logger.ts`は以下の主要機能を提供します：

- 複数ログレベル（ERROR, WARN, INFO, DEBUG）のサポート
- 構造化されたコンテキスト情報の記録
- 処理時間の自動計測
- 環境別のログ設定
- 外部サービスとの連携可能性

```typescript
// 基本的なインポート方法
import { logger } from '@/utils/logger';

// 基本的な使用例
logger.info('アプリケーション初期化完了', { version: '1.0.0' });
```

## 2. ログレベルと使用シナリオ

### エラー、警告、情報、デバッグのログレベル

`logger.ts`は4つの標準ログレベルを提供しています：

| ログレベル | 定義値    | 用途                                 | 環境               |
| ---------- | --------- | ------------------------------------ | ------------------ |
| ERROR      | `'error'` | 致命的な問題、例外、回復不能なエラー | すべての環境       |
| WARN       | `'warn'`  | 潜在的な問題、非推奨機能の使用       | すべての環境       |
| INFO       | `'info'`  | 一般的な操作情報、状態変化           | 開発・ステージング |
| DEBUG      | `'debug'` | 詳細なデバッグ情報                   | 主に開発環境       |

```typescript
// ログレベルの定義
import { LogLevel, logger } from '@/utils/logger';

// 使用例
if (condition) {
  logger.info('ステータス変更', { newStatus: 'active' });
}
```

### 適切なログレベル選択の基準

- **ERROR**: システムが機能を提供できない状況
- **WARN**: 正常動作は継続可能だが注意が必要な状況
- **INFO**: 重要な操作の開始・完了や状態変化
- **DEBUG**: 問題解決のための詳細情報

### 具体的な使用例と実践

```typescript
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
  memoryUsage: process.memoryUsage(),
});
```

## 3. 構造化ログとコンテキスト情報

### LogContext インターフェース

`logger.ts` では、ログのコンテキスト情報を型安全に扱うための `LogContext`
インターフェースを提供しています：

```typescript
// LogContext インターフェース
export interface LogContext {
  [key: string]: unknown; // 任意のプロパティを許容
  component?: string; // コンポーネント名
  userId?: string; // ユーザーID
  requestId?: string; // リクエスト識別子
}
```

このインターフェースに準拠したコンテキスト情報を各ログメソッドに渡すことができます。

### 効果的なコンテキスト追加方法

```typescript
// 基本的なコンテキスト
logger.info('マップデータを読み込みました', {
  component: 'MapContainer', // コンポーネント名を指定
  pointCount: points.length,
  region: 'sado-island',
  loadTimeMs: 342,
});

// エラーオブジェクトを直接渡す
try {
  await fetchData();
} catch (error) {
  logger.error('データ取得失敗', error); // Error オブジェクトはスタックトレースも自動的に含まれます
}

// 複数の情報源からコンテキストを構築
logger.info('ユーザー操作を記録', {
  component: 'UserActivityTracker',
  ...getUserContext(),
  ...getActionContext(),
  timestamp: new Date().toISOString(),
});

// 環境情報を含むコンテキスト
// contextFormatterを使うと常に環境情報が自動追加される
logger.debug('アプリケーション起動', {
  version: ENV.app.VERSION,
  buildDate: ENV.app.BUILD_DATE,
});
```

### 構造化ログの重要性

構造化ログは情報を一貫したフォーマットで記録し、検索、フィルタリング、分析を容易にします。本プロジェクトの
`logger.ts` は自動的に構造化されたJSONフォーマットでログを出力します。

利点：

- パターン認識や問題の傾向分析が容易になる
- プログラムによる自動解析が可能
- 特定の条件に基づくフィルタリングが簡単
- 重要な情報の抽出と可視化が効率的

### コンテキスト情報設計のガイドライン

「佐渡で食えっちゃ」プロジェクトでは、以下のコンテキスト項目を統一して使用することを推奨します：

| コンテキスト項目 | 説明                           | 例                                    |
| ---------------- | ------------------------------ | ------------------------------------- |
| component        | ログを出力したコンポーネント名 | `'MapContainer'`, `'POIService'`      |
| action           | 実行中の操作種別               | `'data_fetch'`, `'user_filter'`       |
| entityId         | 関連するデータのID             | POIのID、ユーザーIDなど               |
| durationMs       | 処理時間（ミリ秒）             | `measureTime` で自動計測される値      |
| status           | 処理結果のステータス           | `'success'`, `'failure'`, `'partial'` |

```typescript
// 推奨コンテキスト形式の例
logger.info('POIデータ処理完了', {
  component: 'POIProcessor',
  action: 'process_csv_data',
  entityIds: ['poi-123', 'poi-456'],
  recordCount: 42,
  durationMs: 156,
  status: 'success',
});
```

### プライバシーとセキュリティ考慮事項

- 個人識別情報（PII）をログに記録しない
- パスワード、トークン、APIキーをログに含めない
- 必要な場合は情報を一部マスキングする
- 位置情報は必要に応じて精度を落とす

```typescript
// 安全なログ記録例
const maskSensitiveData = (data: Record<string, any>): Record<string, any> => {
  if (!data) return data;

  const result = { ...data };

  // センシティブフィールドのマスキング
  const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'email'];
  SENSITIVE_FIELDS.forEach(field => {
    if (field in result) {
      result[field] =
        typeof result[field] === 'string' ? result[field].substring(0, 2) + '****' : '[masked]';
    }
  });

  return result;
};

// マスキング済みデータでログ出力
logger.info(
  'API認証',
  maskSensitiveData({
    endpoint: '/api/auth',
    email: 'user@example.com',
    token: 'abc123xyz',
  })
);
// 出力: { endpoint: '/api/auth', email: 'us****', token: 'ab****' }
```

## 4. パフォーマンス測定とロギング

### 処理時間の自動測定

`logger.ts`は処理時間を自動的に測定し記録する機能を提供しています：

```typescript
// 同期処理の実行時間を測定
const result = logger.measureTime(
  'POIデータのフィルタリング',
  () => filterPOIData(rawData),
  LogLevel.INFO,
  { dataSize: rawData.length }
);

// 非同期処理の実行時間を測定
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

```typescript
// 特定の閾値を超えた場合のみログを記録する例
await logger.measureTimeAsync(
  'マップデータのレンダリング',
  renderMapData,
  LogLevel.WARN, // 閾値を超えた場合は警告レベルで記録
  { componentName: 'MapContainer' },
  500 // 500ms以上かかった場合のみログを出力
);
```

### 非同期処理のエラーハンドリング

`measureTimeAsync`メソッドはエラーも適切に捕捉し記録します：

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

パフォーマンスに影響を与えないよう、条件付きでログを出力する方法を提供しています：

```typescript
// 条件付きログ出力
logger.logIf(user.isAdmin, LogLevel.INFO, '管理者がダッシュボードにアクセスしました', {
  userId: user.id,
});

// デバッグモードでのみ詳細ログを出力
if (ENV.env.isDev) {
  logger.debug('詳細なPOIデータ', poiData);
}
```

### ロギングのパフォーマンス最適化

大量のログ出力はパフォーマンスに影響を与える可能性があります。以下の最適化テクニックを活用しましょう：

```typescript
// 1. サンプリングレートを使用して高頻度ログを制限
logger.configure({
  samplingRates: {
    マップ操作: 100, // 100回に1回だけログを記録
    データ更新: 10, // 10回に1回だけログを記録
  },
});

// 2. 重要度や有用性に基づいてログレベルを適切に選択
logger.debug('詳細なトレース情報'); // 開発環境でのみ必要
logger.info('一般的な操作情報'); // 運用監視に有用

// 3. 大きなデータ構造をログに記録する前に要約
const largeDataSummary = {
  count: largeData.length,
  types: [...new Set(largeData.map(item => item.type))],
  firstItem: largeData[0],
  // ...その他の要約情報
};
logger.debug('大量データの要約', largeDataSummary);
```

## 6. 環境別ロギング設定

### ENV ユーティリティとの連携

「佐渡で食えっちゃ」プロジェクトでは、`@/utils/env.ts`モジュールを使用して環境設定を一元管理しています。ロガー設定も同様にこのモジュールと連携しています：

```typescript
// logger.ts のデフォルトオプション
const defaultOptions: LoggerOptions = {
  minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN, // 開発環境ではINFO以上、本番ではWARN以上
  enableConsole: true,
  transports: [],
  deduplicateErrors: ENV.env.isProd, // 本番環境のみエラー重複抑制を有効化
  deduplicationInterval: 10000, // 10秒
  includeTimestamps: true,
  contextFormatter: context => {
    return {
      ...context,
      appName: ENV.app.NAME,
      environment: ENV.env.MODE,
    };
  },
};
```

### 開発環境での詳細ログ

開発環境では詳細なログ情報が重要です：

```typescript
// 開発環境用設定 (ENV.env.isDev が true の場合)
if (ENV.env.isDev) {
  logger.configure({
    minLevel: LogLevel.DEBUG, // すべてのログレベルを表示
    enableConsole: true, // コンソール出力を有効化
    includeTimestamps: true, // タイムスタンプを表示
    deduplicateErrors: false, // エラーの重複除去を無効化
  });

  // 特定コンポーネントのみ詳細ログを取得
  logger.configure({
    componentLevels: {
      MapContainer: LogLevel.DEBUG, // 地図関連のみデバッグログも表示
      APIClient: LogLevel.INFO, // APIクライアントは情報レベルまで
    },
  });
}
```

### 本番環境でのセキュアなロギング

本番環境ではセキュリティとパフォーマンスに配慮したログ設定が必要です：

```typescript
// 本番環境用設定 (ENV.env.isProd が true の場合)
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

  // 外部エラー追跡サービスと連携（必要に応じて）
  if (ENV.app.USE_ERROR_TRACKING) {
    try {
      logger.info('外部エラー追跡サービスとの連携を初期化しています');
      // 外部エラートラッキングサービスとの連携コード
      logger.addTransport({
        log(level, message, context) {
          if (level === LogLevel.ERROR || level === LogLevel.WARN) {
            // 外部サービスにエラー情報を送信
            sendToExternalService({ level, message, context });
          }
        },
      });
    } catch (err) {
      // 初期化エラーはコンソールにのみ記録
      console.error(
        `ロガー: 外部サービス連携エラー: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
```

### テスト環境でのログ設定

テスト環境では、テストの可読性を保つためにログ出力を最小限に抑えます：

```typescript
// テスト環境用設定
if (ENV.env.isTest) {
  logger.configure({
    minLevel: LogLevel.ERROR, // テスト中はエラーのみ表示
    enableConsole: !ENV.env.isCI, // CI環境ではコンソール出力を無効化
  });
}

// テスト内での使用例
describe('データ処理テスト', () => {
  afterEach(() => {
    // テスト間でログをクリア
    logger.getRecentLogs(); // 呼び出すことでバッファをリセット
  });

  it('エラー状態を適切に処理すること', () => {
    // テスト実行
    processInvalidData();

    // エラーログが記録されたか確認
    const logs = logger.getRecentLogs(LogLevel.ERROR);
    expect(logs.some(log => log.message.includes('データ形式エラー'))).toBe(true);
  });
});
```

### 環境変数からのカスタム設定読み込み

環境変数を使用してログ設定をカスタマイズする例：

```typescript
// 環境変数からログレベルを取得
const configureLoggerFromEnv = () => {
  // ログレベルの取得 - 直接参照ではなくgetEnv()関数を使用
  const logLevelStr = getEnv('LOG_LEVEL', { defaultValue: 'info' });

  // ログレベル文字列からEnum値へ変換
  const getLogLevelFromString = (level: string): LogLevel => {
    const lowerLevel = level.toLowerCase();
    switch (lowerLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  };

  // 環境変数に基づいてロガーを設定
  logger.configure({
    minLevel: getLogLevelFromString(logLevelStr),
    enableConsole: getEnv('LOG_ENABLE_CONSOLE', { defaultValue: true, transform: toBool }),
    includeTimestamps: getEnv('LOG_INCLUDE_TIMESTAMPS', { defaultValue: true, transform: toBool }),
  });

  logger.info('ロガー設定を環境変数から読み込みました', {
    level: logLevelStr,
    console: getEnv('LOG_ENABLE_CONSOLE', { defaultValue: 'true' }),
    env: ENV.env.MODE,
  });
};

// アプリ起動時に設定を読み込む
configureLoggerFromEnv();
```

## 7. 高度なロギング機能の活用

### テスト環境でのログバッファ活用

テスト環境では、過去のログを取得して検証に利用できます：

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
    expect(logs[0].context?.component).toBe('POIFilter');
  });
});
```

### ログ分析とモニタリング

運用環境では以下のアプローチでログを活用しましょう：

1. **パターン認識**: エラーの頻度や時間帯のパターンを分析
2. **相関分析**: エラー発生時の他のイベントとの相関関係を調査
3. **パフォーマンスモニタリング**: `durationMs`の値を時系列で追跡し、性能劣化を検出
4. **ユーザー体験分析**: 特定のエラーや警告がユーザー行動に与える影響を分析

```typescript
// パフォーマンス低下検知のためのログ記録例
logger.measureTimeAsync('マップレンダリング', renderMap, LogLevel.INFO, {
  component: 'MapContainer',
  resolution: `${window.innerWidth}x${window.innerHeight}`,
  poiCount: visiblePOIs.length,
  // タイムスタンプを含めることで時系列分析が可能に
  timestamp: new Date().toISOString(),
});
```

### セキュリティとプライバシーの設計パターン

ログにセンシティブな情報を含めないための推奨パターン：

```typescript
// 個人識別情報のマスキング例
const maskPII = (text: string): string => {
  if (!text) return '';
  if (text.length <= 2) return '*'.repeat(text.length);
  return text.substring(0, 2) + '*'.repeat(Math.min(text.length - 2, 3));
};

// マスキング関数の使用例
logger.info('ユーザーアクション', {
  userId: 'u123456',
  email: maskPII('user@example.com'), // "us***"
  action: 'login',
  ipAddress: maskPII('192.168.1.1'), // "19***"
});

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

### 非同期ロギングとバッファリング

ロギングがアプリケーションのパフォーマンスに与える影響を最小限に抑えるために、ログバッファーを活用できます：

```typescript
// 高頻度ログをバッファリングするカスタムロギング
class BufferedLogger {
  private buffer: Array<{ level: LogLevel; message: string; context?: LogContext }> = [];
  private flushInterval: number;
  private flushTimerId: NodeJS.Timeout | null = null;

  constructor(flushIntervalMs = 5000) {
    this.flushInterval = flushIntervalMs;
    this.startFlushTimer();
  }

  // ログをバッファに追加
  public log(level: LogLevel, message: string, context?: LogContext): void {
    this.buffer.push({ level, message, context });

    // バッファがあまりに大きくなった場合は即時フラッシュ
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  // バッファされたログを一括で処理
  private flush(): void {
    if (this.buffer.length === 0) return;

    // ログをグループ化して一度に処理
    const start = performance.now();

    // バッファ内のログを処理
    this.buffer.forEach(item => {
      logger[item.level](item.message, item.context);
    });

    const duration = performance.now() - start;
    if (duration > 50) {
      // 処理に50ms以上かかった場合は警告
      console.warn(`ログバッファのフラッシュに${Math.round(duration)}ms要しました`);
    }

    // バッファをクリア
    this.buffer = [];
  }

  // 定期フラッシュタイマーを開始
  private startFlushTimer(): void {
    if (this.flushTimerId !== null) return;

    this.flushTimerId = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // リソースの解放
  public dispose(): void {
    if (this.flushTimerId !== null) {
      clearInterval(this.flushTimerId);
      this.flushTimerId = null;
    }
    this.flush(); // 残りのログを処理
  }
}

// 使用例
const bufferedLogger = new BufferedLogger(2000); // 2秒ごとにフラッシュ

// 高頻度ログ出力
for (let i = 0; i < 1000; i++) {
  // ここでは直接loggerを使わずにバッファに追加
  bufferedLogger.log(LogLevel.DEBUG, `繰り返し処理 ${i}`, { iteration: i });
}

// コンポーネントのクリーンアップ時
onUnmount(() => {
  bufferedLogger.dispose();
});
```

### ログローテーションと保持戦略

ブラウザ環境では、アプリケーション実行中のログのみを保持しますが、サーバーサイドでは以下のようなログ保持戦略を検討できます：

```typescript
// サーバーサイドでの使用を想定したログ保持戦略例
interface LogRetentionStrategy {
  setup(): void;
  shouldRotate(): boolean;
  rotateLog(): Promise<void>;
  cleanup(): Promise<void>;
}

class DailyLogRotation implements LogRetentionStrategy {
  private currentDate: string;
  private logDir: string;
  private maxLogFiles: number;

  constructor(logDir: string, maxFiles = 7) {
    this.currentDate = this.getDateStr();
    this.logDir = logDir;
    this.maxLogFiles = maxFiles;
  }

  private getDateStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  public setup(): void {
    // ログディレクトリ作成など
    // fs.mkdirSync(this.logDir, { recursive: true });
  }

  public shouldRotate(): boolean {
    const newDate = this.getDateStr();
    return newDate !== this.currentDate;
  }

  public async rotateLog(): Promise<void> {
    // ファイル操作でログをローテーション
    this.currentDate = this.getDateStr();
    // await fs.rename(currentLog, `${this.logDir}/app-${this.currentDate}.log`);
  }

  public async cleanup(): Promise<void> {
    // 古いログファイルを削除
    // const files = await fs.readdir(this.logDir);
    // ... 最大ファイル数を超えた古いファイルを削除
  }
}

// サーバーサイドでのログ管理の例
// const logStrategy = new DailyLogRotation('./logs', 14); // 14日分のログを保持
// logStrategy.setup();

// 定期的にログローテーションチェック
// setInterval(async () => {
//   if (logStrategy.shouldRotate()) {
//     await logStrategy.rotateLog();
//     await logStrategy.cleanup();
//   }
// }, 3600000); // 1時間ごとにチェック
```

### 分散システムとトレーシング

複数のマイクロサービスやコンポーネントにまたがる処理を追跡するためのトレース識別子の使用例：

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

// APIリクエストにもトレースIDを含める
const fetchWithTrace = async (url: string, options?: RequestInit) => {
  const headers = {
    ...(options?.headers || {}),
    'X-Trace-ID': traceId,
  };

  logger.debug('外部APIリクエスト', { traceId, url });
  const response = await fetch(url, { ...options, headers });
  logger.debug('外部APIレスポンス', {
    traceId,
    status: response.status,
    ok: response.ok,
  });

  return response;
};

// 外部システムとの連携時にトレースIDを活用
const data = await fetchWithTrace('https://api.example.com/data');

// 処理完了時もトレースIDを含める
logger.info('ユーザーリクエスト完了', {
  traceId,
  durationMs: performance.now() - startTime,
  status: 'success',
});
```
