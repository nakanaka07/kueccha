import { logger, LogLevel } from '@/utils/logger';

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
