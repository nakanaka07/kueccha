import { LogLevel } from '@/types/logger';
import { logger } from '@/utils/logger';

/**
 * パフォーマンス計測のためのラッパー関数
 * 非同期処理の実行時間を計測してロギングする
 */
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>,
  level: LogLevel = LogLevel.DEBUG
): Promise<T> => {
  return logger.measureTimeAsync(name, fn, level);
};

/**
 * 同期処理用のパフォーマンス計測
 * 同期処理の実行時間を計測してロギングする
 */
export const measureSyncPerformance = <T>(
  name: string,
  fn: () => T,
  level: LogLevel = LogLevel.DEBUG,
  extraContext: Record<string, unknown> = {}
): T => {
  const startTime = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - startTime;
    
    logPerformanceResult(name, duration, level, extraContext, true);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`${name} 失敗`, {
      duration: `${duration.toFixed(2)}ms`,
      error,
      component: 'PerformanceMonitor',
      ...extraContext,
    });
    throw error;
  }
};

/**
 * パフォーマンス結果をログに出力するヘルパー関数
 */
export function logPerformanceResult(
  name: string,
  duration: number,
  level: LogLevel,
  extraContext: Record<string, unknown> = {},
  success: boolean = true
): void {
  const message = success ? `${name} 完了` : `${name} 失敗`;
  const context = {
    duration: `${duration.toFixed(2)}ms`,
    component: 'PerformanceMonitor',
    ...extraContext,
  };

  switch (level) {
    case LogLevel.DEBUG:
      logger.debug(message, context);
      break;
    case LogLevel.INFO:
      logger.info(message, context);
      break;
    case LogLevel.WARN:
      logger.warn(message, context);
      break;
    case LogLevel.ERROR:
      logger.error(message, context);
      break;
  }
}

// 型安全なプロパティアクセスのためのヘルパー関数
export function safeGetProperty<T extends Record<string, unknown>>(obj: T, key: string): unknown {
  if (Object.hasOwn(obj, key)) {
    return obj[key as keyof T];
  }
  return undefined;
}
