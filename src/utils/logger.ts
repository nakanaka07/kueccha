/**
 * フロントエンドのロギングユーティリティ
 *
 * サーバー側のロガーとの一貫性を保ちつつ、ブラウザ環境でも動作するよう設計。
 * 環境変数を通じてログレベルを制御し、開発/本番環境で適切な出力形式を提供します。
 */

// ログレベルの定義
type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogCategory = 'CONFIG' | 'API' | 'APP' | 'AUTH' | 'DB';
export type LogCode =
  | 'ENV_ERROR'
  | 'ENV_WARNING'
  | 'ENV_DEFAULT'
  | 'ENV_CHECK'
  | 'PWA_WARNING';
type LogDetails = unknown;

// 環境設定
const IS_DEV = import.meta.env.MODE === 'development';
const LOG_LEVEL = (import.meta.env.VITE_LOG_LEVEL || 'info').toLowerCase() as LogLevel;

// ログレベルの優先順位
const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * 指定されたレベルのログを出力すべきかを判断
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL];
}

/**
 * ログを出力する基本関数
 */
function log(
  level: LogLevel,
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  if (!shouldLog(level)) return;

  const logData = {
    timestamp: new Date().toISOString(),
    level,
    category,
    code,
    message,
    details,
    environment: import.meta.env.MODE,
  };

  if (IS_DEV) {
    // 開発環境: 読みやすいフォーマット
    console[level](
      `[${logData.timestamp}] ${level.toUpperCase()} [${category}:${code}]: ${message}`,
      details !== undefined ? { details } : '',
    );
  } else {
    // 本番環境: JSON形式（収集/分析しやすい）
    console[level](JSON.stringify(logData));
  }
}

// 各ログレベルのエクスポート関数
export function logError(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('error', category, code, message, details);
}

export function logWarn(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('warn', category, code, message, details);
}

export function logInfo(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('info', category, code, message, details);
}

export function logDebug(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('debug', category, code, message, details);
}

// デフォルトエクスポート - 簡潔なアクセス用
export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
};
