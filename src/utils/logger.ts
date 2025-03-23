/**
 * フロントエンドのロギングユーティリティ
 *
 * サーバー側のロガーとの一貫性を保ちつつ、ブラウザ環境でも動作するよう設計。
 * 環境変数を通じてログレベルを制御し、開発/本番環境で適切な出力形式を提供します。
 */
import type { LogCategory, LogCode } from '../types/logging';

// ログレベルの定義
type LogLevel = 'error' | 'warn' | 'info' | 'debug';
type LogDetails = unknown;

// 環境設定
const IS_DEV = import.meta.env.MODE === 'development';
const LOG_LEVEL = (import.meta.env.VITE_LOG_LEVEL ?? 'info').toLowerCase();

// ログレベルの優先順位マップ
const LOG_LEVEL_ERROR = 0;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_DEBUG = 3;

/**
 * ログレベル文字列を数値に変換する関数
 */
function getLogLevelValue(level: string): number {
  switch (level) {
    case 'error': return LOG_LEVEL_ERROR;
    case 'warn': return LOG_LEVEL_WARN;
    case 'info': return LOG_LEVEL_INFO;
    case 'debug': return LOG_LEVEL_DEBUG;
    default: return LOG_LEVEL_INFO; // デフォルトは info
  }
}

/**
 * 指定されたレベルのログを出力すべきかを判断
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevelValue = getLogLevelValue(LOG_LEVEL);
  const requestedLevelValue = getLogLevelValue(level);
  return requestedLevelValue <= currentLevelValue;
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

  const logMessage = `[${logData.timestamp}] ${level.toUpperCase()} [${category}:${code}]: ${message}`;
  const detailsObj = details !== undefined ? { details } : {};
  
  if (IS_DEV) {
    // 開発環境: 読みやすいフォーマット
    switch (level) {
      case 'error':
        console.error(logMessage, detailsObj);
        break;
      case 'warn':
        console.warn(logMessage, detailsObj);
        break;
      case 'info':
        console.info(logMessage, detailsObj);
        break;
      case 'debug':
        // デバッグ情報は info レベルで出力
        console.info(`[DEBUG] ${logMessage}`, detailsObj);
        break;
    }
  } else {
    // 本番環境: JSON形式（収集/分析しやすい）
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logData));
        break;
      case 'warn':
        console.warn(JSON.stringify(logData));
        break;
      case 'info':
      case 'debug':
        // debug も info として扱う
        console.info(JSON.stringify(logData));
        break;
    }
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