import { useRef, useEffect } from 'react';

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
  // ロガーを活用したパフォーマンス計測
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

    // logger.logはプライベートなので、レベルに応じて適切なメソッドを使用する
    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(`${name} 完了`, {
          duration: `${duration.toFixed(2)}ms`,
          component: 'PerformanceMonitor',
          ...extraContext,
        });
        break;
      case LogLevel.INFO:
        logger.info(`${name} 完了`, {
          duration: `${duration.toFixed(2)}ms`,
          component: 'PerformanceMonitor',
          ...extraContext,
        });
        break;
      case LogLevel.WARN:
        logger.warn(`${name} 完了`, {
          duration: `${duration.toFixed(2)}ms`,
          component: 'PerformanceMonitor',
          ...extraContext,
        });
        break;
      case LogLevel.ERROR:
        logger.error(`${name} 完了`, {
          duration: `${duration.toFixed(2)}ms`,
          component: 'PerformanceMonitor',
          ...extraContext,
        });
        break;
    }

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

// 型安全なプロパティアクセスのためのヘルパー関数
function safeGetProperty<T extends Record<string, unknown>>(obj: T, key: string): unknown {
  // Object.hasOwnを使用して安全に所有プロパティをチェック
  if (Object.hasOwn(obj, key)) {
    return obj[key as keyof T];
  }
  return undefined;
}

/**
 * コンポーネントの再レンダリング理由を追跡するフック
 * 開発環境でのデバッグに役立つ
 */
export function useWhyDidYouUpdate(componentName: string, props: Record<string, unknown>): void {
  // 型安全なMap参照を使用
  const previousProps = useRef<Map<string, unknown>>(new Map());

  useEffect(() => {
    if (previousProps.current.size > 0) {
      const changedPropsMap = new Map<string, { from: unknown; to: unknown }>();
      let hasChanges = false;

      // Map.entriesを使用して安全なイテレーション
      Array.from(previousProps.current.entries()).forEach(([key, prevValue]) => {
        const currentValue = safeGetProperty(props, key);

        if (prevValue !== currentValue) {
          changedPropsMap.set(key, {
            from: prevValue,
            to: currentValue,
          });
          hasChanges = true;
        }
      });

      // 新しいプロパティをチェック
      for (const [key] of Object.entries(props)) {
        if (!previousProps.current.has(key)) {
          const currentValue = safeGetProperty(props, key);
          changedPropsMap.set(key, {
            from: undefined,
            to: currentValue,
          });
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // 変更内容をログ出力用に安全に変換
        const changedPropsForLog: Record<string, unknown> = {};
        changedPropsMap.forEach((value, key) => {
          // Object.definePropertyを使用して安全にプロパティを設定
          Object.defineProperty(changedPropsForLog, key, {
            value,
            enumerable: true,
            configurable: true,
            writable: true,
          });
        });

        logger.debug(`${componentName}の再レンダリング理由:`, {
          component: componentName,
          changedProps: changedPropsForLog,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 新しいプロパティ値をMapに保存
    const newPropsMap = new Map<string, unknown>();
    for (const [key, value] of Object.entries(props)) {
      newPropsMap.set(key, value);
    }

    previousProps.current = newPropsMap;
  });
}

/**
 * コンポーネントのレンダリング回数を追跡するフック
 * 開発環境でのデバッグに役立つ
 */
export function useRenderCounter(componentName: string): void {
  const renderCount = useRef<number>(0);

  useEffect(() => {
    // 安全にカウントをインクリメント
    const count = renderCount.current + 1;
    renderCount.current = count;

    logger.debug(`${componentName}がレンダリングされました`, {
      component: componentName,
      renderCount: count,
      timestamp: new Date().toISOString(),
    });
  });
}
