/**
 * ロギング関連ユーティリティ関数
 * 
 * ロギング処理に関する補助機能を提供します。
 * 
 * @author 佐渡で食えっちゃプロジェクトチーム
 * @version 1.0.0
 * @lastUpdate 2025年4月28日
 */

import { logger, LogLevel, createLogContext } from './logger';

/**
 * 指定されたログレベルに基づいてロガーメソッドを呼び出す
 *
 * @param level - ログレベル
 * @param logMessage - ログメッセージ
 * @param context - 追加のコンテキスト情報
 */
export const logWithLevel = (
  level: LogLevel,
  logMessage: string,
  context: Record<string, unknown>
): void => {
  switch (level) {
    case LogLevel.ERROR:
      logger.error(logMessage, context);
      break;
    case LogLevel.WARN:
      logger.warn(logMessage, context);
      break;
    case LogLevel.INFO:
      logger.info(logMessage, context);
      break;
    case LogLevel.DEBUG:
      logger.debug(logMessage, context);
      break;
    default:
      logger.info(logMessage, context);
  }
};

/**
 * メッセージを長さに基づいて要約する
 *
 * @param message - 元のメッセージ
 * @param maxLength - 最大長（デフォルト: 200）
 * @returns 要約されたメッセージ
 */
export const summarizeMessage = (message: string, maxLength: number = 200): string => {
  return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
};

/**
 * コンポーネント名とメッセージを使用して標準化されたログ出力を行う
 * 
 * @param level - ログレベル
 * @param component - コンポーネント名
 * @param message - ログメッセージ
 * @param additionalContext - 追加コンテキスト情報
 */
export const logStandard = (
  level: LogLevel,
  component: string,
  message: string,
  additionalContext: Record<string, unknown> = {}
): void => {
  const context = createLogContext(component, additionalContext);
  logWithLevel(level, message, context);
};

/**
 * エラーオブジェクトからログコンテキストを作成するヘルパー
 * 
 * @param error - エラーオブジェクト
 * @param additionalContext - 追加のコンテキスト
 * @returns エラー情報を含むログコンテキスト
 */
export const createErrorContext = (
  error: unknown,
  additionalContext: Record<string, unknown> = {}
): Record<string, unknown> => {
  const errorInfo: Record<string, unknown> = {
    errorMessage: error instanceof Error ? error.message : String(error),
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    ...additionalContext,
  };
  
  // スタックトレースが存在する場合は追加
  if (error instanceof Error && error.stack) {
    errorInfo.stack = error.stack;
  }
  
  return errorInfo;
};

/**
 * 指定された確率でのみログを出力する関数
 * サンプリングレートの代わりに使用できます
 * 
 * @param level - ログレベル
 * @param message - ログメッセージ
 * @param context - ログコンテキスト
 * @param probability - ログを出力する確率（0-1）
 */
export const logRandomly = (
  level: LogLevel,
  message: string,
  context: Record<string, unknown>,
  probability: number = 0.1 // デフォルトで10%の確率でログを出力
): void => {
  if (Math.random() <= probability) {
    logWithLevel(level, message, {
      ...context,
      sampled: true,
      sampleRate: probability,
    });
  }
};

/**
 * パフォーマンス測定の結果を簡単に出力するヘルパー
 * 
 * @param operation - 測定対象の操作名
 * @param durationMs - 所要時間（ミリ秒）
 * @param component - コンポーネント名
 * @param additionalContext - 追加コンテキスト
 */
export const logPerformance = (
  operation: string,
  durationMs: number,
  component: string,
  additionalContext: Record<string, unknown> = {}
): void => {
  const durationFormatted = typeof durationMs === 'number' 
    ? durationMs.toFixed(2)
    : String(durationMs);
  
  const context = createLogContext(component, {
    operation,
    durationMs: durationFormatted,
    performanceMetric: true,
    ...additionalContext,
  });
  
  // 時間によってログレベルを変える（閾値は調整可能）
  let level = LogLevel.DEBUG;
  if (durationMs > 1000) {
    level = LogLevel.INFO;
  }
  if (durationMs > 3000) {
    level = LogLevel.WARN;
  }
  
  logWithLevel(level, `${operation} 完了 (${durationFormatted}ms)`, context);
};

// エクスポートする主要関数群
export {
  logger,
  createLogContext,
  LogLevel,
};