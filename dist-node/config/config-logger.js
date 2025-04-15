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
// 外部公開用のログ機能
export const configLogger = {
  error: createLogger('error'),
  warn: createLogger('warn'),
  info: createLogger('info'),
  debug: createLogger('debug'),
};
