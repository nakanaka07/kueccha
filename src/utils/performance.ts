/**
 * パフォーマンスユーティリティモジュール
 *
 * アプリケーションのパフォーマンス測定と最適化を支援するユーティリティ関数群を提供します。
 * コード最適化ガイドラインとGoogle Maps最適化ガイドラインに準拠しています。
 * 静的ホスティング環境向けに最適化されています。
 *
 * @author 佐渡で食えっちゃプロジェクトチーム
 * @version 1.1.0
 * @lastUpdate 2025年4月28日
 * @see {@link ../../docs/code_optimization_guidelines.md コード最適化ガイドライン}
 * @see {@link ../../docs/google_maps_guidelines/07_performance.md Google Mapsパフォーマンス最適化ガイドライン}
 */

import { useEffect, useRef } from 'react';

import { ENV } from '@/env/index';
import { LogLevel } from '@/types/logger';
import { logger } from '@/utils/logger';

// 静的ホスティング環境での最適化フラグ
const IS_STATIC_HOSTING = ENV.env.isProd;
// パフォーマンス計測を完全に無効化するかどうかのフラグ
const DISABLE_PERF_MEASUREMENTS = IS_STATIC_HOSTING && !ENV.features.enableProductionProfiling;

/**
 * インターフェースの拡張 - メモリに関する診断情報
 */
declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

/**
 * 同期処理のパフォーマンスを測定する関数
 *
 * @param label - 測定対象を識別するラベル
 * @param fn - 測定する関数
 * @param logLevel - ログレベル（デフォルト: LogLevel.DEBUG）
 * @param context - 追加のログコンテキスト
 * @returns 測定対象関数の実行結果
 *
 * @example
 * const result = measureSyncPerformance(
 *   '営業状態計算',
 *   () => calculateBusinessStatus(poi),
 *   LogLevel.DEBUG,
 *   { entityId: poi.id }
 * );
 */
export function measureSyncPerformance<T>(
  label: string,
  fn: () => T,
  logLevel: LogLevel = LogLevel.DEBUG,
  context: Record<string, unknown> = {}
): T {
  // パフォーマンス計測無効化フラグが立っている場合、即座に関数を実行
  if (DISABLE_PERF_MEASUREMENTS) {
    return fn();
  }

  // 開発環境でのみ測定を実施
  if (!ENV.env.isDev) {
    return fn();
  }

  const start = performance.now();
  try {
    const result = fn();
    const end = performance.now();
    const duration = end - start; // logger.logではなく、ログレベルに応じたメソッドを直接呼び出す
    if (logLevel === LogLevel.ERROR) {
      logger.error(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure',
        label,
        durationMs: duration,
        ...context,
      });
    } else if (logLevel === LogLevel.WARN) {
      logger.warn(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure',
        label,
        durationMs: duration,
        ...context,
      });
    } else if (logLevel === LogLevel.INFO) {
      logger.info(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure',
        label,
        durationMs: duration,
        ...context,
      });
    } else {
      logger.debug(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure',
        label,
        durationMs: duration,
        ...context,
      });
    }

    return result;
  } catch (error) {
    const end = performance.now();
    logger.error(`${label} エラー発生`, {
      component: 'Performance',
      action: 'measure_error',
      label,
      durationMs: end - start,
      error,
      ...context,
    });
    throw error;
  }
}

/**
 * 非同期処理のパフォーマンスを測定する関数
 *
 * @param label - 測定対象を識別するラベル
 * @param fn - 測定する非同期関数
 * @param logLevel - ログレベル（デフォルト: LogLevel.DEBUG）
 * @param context - 追加のログコンテキスト
 * @returns 測定対象関数のPromise
 *
 * @example
 * const data = await measureAsyncPerformance(
 *   'POIデータ取得',
 *   () => fetchPOIData(region),
 *   LogLevel.INFO,
 *   { region: region.id }
 * );
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>,
  logLevel: LogLevel = LogLevel.DEBUG,
  context: Record<string, unknown> = {}
): Promise<T> {
  // パフォーマンス計測無効化フラグが立っている場合、即座に関数を実行
  if (DISABLE_PERF_MEASUREMENTS) {
    return fn();
  }

  // 開発環境でのみ測定を実施
  if (!ENV.env.isDev) {
    return fn();
  }

  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    const duration = end - start; // logger.logではなく、ログレベルに応じたメソッドを直接呼び出す
    if (logLevel === LogLevel.ERROR) {
      logger.error(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure_async',
        label,
        durationMs: duration,
        ...context,
      });
    } else if (logLevel === LogLevel.WARN) {
      logger.warn(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure_async',
        label,
        durationMs: duration,
        ...context,
      });
    } else if (logLevel === LogLevel.INFO) {
      logger.info(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure_async',
        label,
        durationMs: duration,
        ...context,
      });
    } else {
      logger.debug(`${label} 実行時間: ${duration.toFixed(2)}ms`, {
        component: 'Performance',
        action: 'measure_async',
        label,
        durationMs: duration,
        ...context,
      });
    }

    return result;
  } catch (error) {
    const end = performance.now();
    logger.error(`${label} エラー発生`, {
      component: 'Performance',
      action: 'measure_async_error',
      label,
      durationMs: end - start,
      error,
      ...context,
    });
    throw error;
  }
}

/**
 * コンポーネントの再レンダリング理由をトラッキングするカスタムフック
 *
 * @param componentName - 対象コンポーネント名
 * @param props - トラッキングするprops
 * @param enableTracking - トラッキングを有効にするフラグ（デフォルト: 開発環境のみ）
 *
 * @example
 * // コンポーネント内で使用
 * useWhyDidYouUpdate('MyComponent', { id, name, data });
 */
export function useWhyDidYouUpdate(
  componentName: string,
  props: Record<string, unknown>,
  enableTracking = ENV.env.isDev
): void {
  // 前回のpropsを保持するためのref - 常に初期化する（条件付きフックは不可）
  const prevPropsRef = useRef<Record<string, unknown>>({});
  // トラッキング有効状態を参照として保持
  const trackingEnabledRef = useRef<boolean>(enableTracking);

  // 有効状態を更新
  trackingEnabledRef.current = enableTracking;

  useEffect(() => {
    // トラッキングが無効なら処理しない
    if (!trackingEnabledRef.current || !ENV.env.isDev) {
      return;
    }

    const prevProps = prevPropsRef.current; // 変更されたプロパティを追跡
    const changedProps: Record<string, { from: unknown; to: unknown }> = {};
    let hasChanges = false;
    // オブジェクトインジェクション警告を回避するため、静的なプロパティアクセスパターンを使用
    // Object.entriesを使用し、各要素を分割代入でアクセス
    // 注: 安全なコードであるためESLint警告を一部無効化しています
    Object.entries(props).forEach(([propKey, propValue]) => {
      // Objectメソッドを使用して安全にプロパティ存在確認
      const hasPrevValue = Object.prototype.hasOwnProperty.call(prevProps, propKey); // 安全なプロパティアクセス
      // eslint-disable-next-line security/detect-object-injection
      const prevValue = hasPrevValue ? prevProps[propKey] : undefined;

      // 値の変更を検出
      if (prevValue !== propValue) {
        hasChanges = true;
        // 安全な方法でオブジェクトを更新
        // eslint-disable-next-line security/detect-object-injection
        changedProps[propKey] = {
          from: prevValue,
          to: propValue,
        };
      }
    });

    // 変更があった場合のみログ出力
    if (hasChanges) {
      logger.debug(`${componentName} が再レンダリングされました`, {
        component: componentName,
        action: 'rerender',
        changedProps,
      });
    }

    // 現在のpropsを保存
    prevPropsRef.current = { ...props };
  });
}

/**
 * メモリ使用状況を測定・報告する関数
 *
 * @param label - 測定のラベル
 * @param context - 追加のログコンテキスト
 *
 * @example
 * // メモリ使用状況のスナップショットを記録
 * reportMemoryUsage('マップデータ読み込み後', { mapDataSize: data.length });
 */
export function reportMemoryUsage(label: string, context: Record<string, unknown> = {}): void {
  // 開発環境でのみ測定を実施
  if (!ENV.env.isDev) return;

  // メモリ使用量の測定（対応ブラウザのみ）
  if (window.performance && performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;

    logger.debug(`メモリ使用状況: ${label}`, {
      component: 'Performance',
      action: 'memory_usage',
      label,
      usedJSHeapSizeMB: Math.round(usedJSHeapSize / (1024 * 1024)),
      totalJSHeapSizeMB: Math.round(totalJSHeapSize / (1024 * 1024)),
      jsHeapSizeLimitMB: Math.round(jsHeapSizeLimit / (1024 * 1024)),
      usagePercentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100),
      ...context,
    });
  }
}

/**
 * Google Mapsのレンダリングパフォーマンスを測定する関数
 *
 * @param map - Google Maps インスタンス
 * @param operation - 測定する操作の名前（例: 'マーカー追加', 'クラスタリング'）
 * @param fn - 測定する関数
 * @param context - 追加のログコンテキスト
 * @returns 測定対象関数の実行結果
 *
 * @example
 * measureMapOperation(map, 'POIマーカー追加', () => {
 *   // マーカー追加処理
 *   return addedMarkersCount;
 * }, { poiCount: data.length });
 */
export function measureMapOperation<T>(
  map: google.maps.Map,
  operation: string,
  fn: () => T,
  context: Record<string, unknown> = {}
): T {
  // 開発環境でのみ測定を実施
  if (!ENV.env.isDev) {
    return fn();
  }

  const start = performance.now();
  const mapCenter = map.getCenter();
  const zoom = map.getZoom();

  try {
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    logger.debug(`マップ操作: ${operation} (${duration.toFixed(2)}ms)`, {
      component: 'GoogleMaps',
      action: 'map_operation',
      operation,
      durationMs: duration,
      zoom,
      center: mapCenter ? { lat: mapCenter.lat(), lng: mapCenter.lng() } : null,
      ...context,
    });

    return result;
  } catch (error) {
    const end = performance.now();
    logger.error(`マップ操作エラー: ${operation}`, {
      component: 'GoogleMaps',
      action: 'map_operation_error',
      operation,
      durationMs: end - start,
      zoom,
      center: mapCenter ? { lat: mapCenter.lat(), lng: mapCenter.lng() } : null,
      error,
      ...context,
    });
    throw error;
  }
}

/**
 * 処理時間のベンチマーク関数
 * 複数回測定して平均・最小・最大時間を記録
 *
 * @param label - ベンチマークの識別ラベル
 * @param fn - 測定する関数
 * @param iterations - 繰り返し測定する回数（デフォルト: 10）
 * @param context - 追加のログコンテキスト
 * @returns 測定結果の統計情報
 *
 * @example
 * // 特定の処理の実行時間を複数回測定
 * const stats = benchmark('POIフィルタリング処理', () => {
 *   return filterPOIsByCategory(allPOIs, selectedCategories);
 * }, 5);
 */
export function benchmark<T>(
  label: string,
  fn: () => T,
  iterations = 10,
  context: Record<string, unknown> = {}
): {
  results: T[];
  stats: {
    min: number;
    max: number;
    avg: number;
    total: number;
  };
} {
  // 開発環境でのみ詳細測定を実施
  const actualIterations = ENV.env.isDev ? iterations : 1;

  const times: number[] = [];
  const results: T[] = [];

  // 指定回数測定を実施
  for (let i = 0; i < actualIterations; i++) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    times.push(end - start);
    results.push(result);
  }

  // 統計情報の計算
  const min = Math.min(...times);
  const max = Math.max(...times);
  const total = times.reduce((sum, time) => sum + time, 0);
  const avg = total / times.length;

  // 開発環境のみログ出力
  if (ENV.env.isDev) {
    logger.debug(`ベンチマーク: ${label}`, {
      component: 'Performance',
      action: 'benchmark',
      label,
      iterations: times.length,
      minMs: min.toFixed(2),
      maxMs: max.toFixed(2),
      avgMs: avg.toFixed(2),
      totalMs: total.toFixed(2),
      ...context,
    });
  }

  return {
    results,
    stats: { min, max, avg, total },
  };
}
