import { useRef, useEffect } from 'react';

import { logger } from '@/utils/logger';
import { safeGetProperty } from '@/utils/safeUtils';

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
