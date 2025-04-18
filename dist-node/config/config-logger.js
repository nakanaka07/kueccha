/**
 * シンプルな設定用ロガー
 * 参考: logger_usage_guidelines.md
 *
 * KISS（Keep It Simple, Stupid）とYAGNI（You Aren't Gonna Need It）の原則に基づいて最適化
 */
// 環境変数からログレベルを取得（デフォルトは全て有効）
const getEnvLogLevel = () => {
  const logLevel = process.env.LOG_LEVEL ?? '';
  // 明示的に空文字列でないことを確認
  if (logLevel.length > 0) {
    // 有効なログレベルの場合のみその値を使用
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (validLevels.includes(logLevel)) {
      return logLevel;
    }
  }
  return 'debug';
};
// ログレベルの数値マッピング（優先度による比較のため）
const LOG_LEVEL_PRIORITY = {
  error: 3,
  warn: 2,
  info: 1,
  debug: 0,
};
// 現在の環境でログレベルが有効かどうかを判定
const isLogLevelEnabled = level => {
  const currentLevel = getEnvLogLevel();
  // 型安全なアクセス - ESLint security/detect-object-injection 対策
  // 明示的な条件チェックでオブジェクトインジェクションを回避
  let levelPriority = 0;
  let currentPriority = 0;
  if (level === 'error') levelPriority = LOG_LEVEL_PRIORITY.error;
  else if (level === 'warn') levelPriority = LOG_LEVEL_PRIORITY.warn;
  else if (level === 'info') levelPriority = LOG_LEVEL_PRIORITY.info;
  else if (level === 'debug') levelPriority = LOG_LEVEL_PRIORITY.debug;
  if (currentLevel === 'error') currentPriority = LOG_LEVEL_PRIORITY.error;
  else if (currentLevel === 'warn') currentPriority = LOG_LEVEL_PRIORITY.warn;
  else if (currentLevel === 'info') currentPriority = LOG_LEVEL_PRIORITY.info;
  else if (currentLevel === 'debug') currentPriority = LOG_LEVEL_PRIORITY.debug;
  return levelPriority >= currentPriority;
};
// 共通のログ出力関数（DRY原則に基づく実装）
/* eslint-disable no-console */
const createLogger = level => (message, context) => {
  if (!isLogLevelEnabled(level)) return;
  // 本番環境ではdebugログを出力しない（NODE_ENVによる制御）
  if (level === 'debug' && process.env.NODE_ENV === 'production') return;
  // 常に一貫したフォーマットでメッセージを表示
  const formattedMessage = `[${level.toUpperCase()}] ${message}`;
  // 安全なメソッド呼び出し
  let logMethod;
  switch (level) {
    case 'error':
      logMethod = console.error;
      break;
    case 'warn':
      logMethod = console.warn;
      break;
    case 'info':
      logMethod = console.info;
      break;
    case 'debug':
      logMethod = console.debug;
      break;
    default:
      logMethod = console.log;
  }
  // contextがundefinedでなく、プロパティを持つ場合のみコンテキスト付きで出力
  if (context !== undefined && Object.keys(context).length > 0) {
    logMethod(formattedMessage, context);
  } else {
    logMethod(formattedMessage);
  }
};
/* eslint-enable no-console */
// パフォーマンス計測ユーティリティ
const createTimer = logFunc => {
  return (operationName, context = {}) => {
    // 高精度タイムスタンプを使用して開始時間を記録
    const startTime = performance.now();
    return () => {
      // 終了時間を計測
      const endTime = performance.now();
      // 処理時間を計算（ミリ秒単位）
      const duration = endTime - startTime; // 計測結果をログに記録
      const performanceContext = {
        ...context,
        duration,
        startTime,
        endTime,
        operationType:
          typeof context.operationType === 'string' ? context.operationType : 'general',
      };
      logFunc(`Performance: ${operationName} (${duration.toFixed(2)}ms)`, performanceContext);
      return {
        duration,
        operationName,
        context: performanceContext,
      };
    };
  };
};
// 非同期処理のパフォーマンス計測
const measureAsync = logFunc => {
  return async (operationName, operation, context = {}) => {
    const startTime = performance.now();
    try {
      // 実際の処理を実行
      const result = await operation();
      // 終了時間と処理時間を計測
      const endTime = performance.now();
      const duration = endTime - startTime; // 成功した場合のログ記録
      const performanceContext = {
        ...context,
        duration,
        startTime,
        endTime,
        operationType: typeof context.operationType === 'string' ? context.operationType : 'async',
        success: true,
      };
      logFunc(`Performance: ${operationName} (${duration.toFixed(2)}ms)`, performanceContext);
      return result;
    } catch (error) {
      // エラー発生時も処理時間を計測
      const endTime = performance.now();
      const duration = endTime - startTime;
      // エラーの場合のログ記録
      const errorContext = {
        ...context,
        duration,
        startTime,
        endTime,
        operationType: typeof context.operationType === 'string' ? context.operationType : 'async',
        success: false,
        error,
      };
      // エラー情報をerrorレベルでログ出力
      createLogger('error')(`Failed: ${operationName} (${duration.toFixed(2)}ms)`, errorContext);
      // エラーを再スロー
      throw error;
    }
  };
};
// 外部公開用のログ機能
export const configLogger = {
  error: createLogger('error'),
  warn: createLogger('warn'),
  info: createLogger('info'),
  debug: createLogger('debug'),
  // パフォーマンス計測関連機能
  startTimer: createTimer(createLogger('info')),
  startDebugTimer: createTimer(createLogger('debug')),
  measure: measureAsync(createLogger('info')),
  measureDebug: measureAsync(createLogger('debug')),
};
