# ロガー使用ガイドライン

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
const maskSensitiveData = (data: Record<string, any>) => {
  const result = { ...data };
  const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'email'];
  
  SENSITIVE_FIELDS.forEach(field => {
    if (field in result) {
      result[field] = typeof result[field] === 'string' 
        ? result[field].substring(0, 2) + '****' 
        : '[masked]';
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

## 4. パフォーマンス測定とロギング

### 処理時間の自動測定

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

// デバッグモードでのみ詳細ログを出力
if (ENV.env.isDev) {
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
    expect(logs[0].context?.component).toBe('POIFilter');
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

- [x] **適切なログレベルの使用**: 重要度に応じた適切なログレベルを選択
- [x] **構造化ログ形式**: JSON形式など解析可能な形式でログを出力
- [x] **コンテキスト情報の追加**: 問題診断に役立つコンテキスト情報を含める
- [x] **パフォーマンス測定**: 重要な操作の実行時間を計測
- [x] **プライバシー保護**: 個人情報や機密情報をマスク処理
- [x] **環境別設定**: 開発・テスト・本番環境に応じたログ設定
- [x] **トレーシング対応**: 関連する処理間で識別子を共有

> **関連ガイドライン**:
> - [環境変数管理ガイドライン](./env_usage_guidelines.md) - ロギング設定のための環境変数活用
> - [コード最適化ガイドライン](./code_optimization_guidelines.md) - パフォーマンス監視とデバッグテクニック
>
> **参考リンク**：
> - [MDN Console API](https://developer.mozilla.org/ja/docs/Web/API/Console)
> - [構造化ロギングのベストプラクティス](https://betterstack.com/community/guides/logging/structured-logging/)
> - [フロントエンドログ管理ガイド](https://sematext.com/blog/javascript-logging/)
