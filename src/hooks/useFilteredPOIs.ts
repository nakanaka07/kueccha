import { useMemo, useRef, useCallback } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { ENV } from '@/utils/env';
import { logger, LogLevel, type LogContext } from '@/utils/logger';

/**
 * POIフィルタリングのオプション
 */
export interface FilterOptions {
  /**
   * カテゴリでフィルタリングする場合の対象カテゴリ配列
   * 指定された場合、配列内のいずれかのカテゴリに一致するPOIのみが返される
   */
  categories?: string[];

  /**
   * 営業中のみ表示するかどうか
   * trueの場合、閉店しているPOIや当日が定休日のPOIは除外される
   */
  isOpen?: boolean;

  /**
   * 検索テキスト
   * 名称、ジャンル、住所のいずれかが一致するPOIのみが返される
   */
  searchText?: string;
}

// パフォーマンス分析用の拡張ログコンテキスト型
interface FilterLogContext extends LogContext {
  component: string;
  batchId: string;
  environment: string;
  inputSize: number;
  entityId: string;
  action: string;
  filterConfig: {
    categoriesCount: number;
    isOpen: boolean;
    hasSearchText: boolean;
  };
  performanceMetrics?: {
    executionTimeMs: number;
    itemsPerMs: number;
    filteringEfficiency: number;
    performanceChangeRate: string; // 'N/A', '+10%', '-5%' などの値を含む
  };
}

// コンポーネント識別子（ログ出力で使用）
const COMPONENT_NAME = 'useFilteredPOIs';

// 環境変数から取得したパフォーマンス設定
// 型安全な環境変数アクセスを確保
const PERFORMANCE_CONFIG = {
  // フィルタリング処理時間の警告閾値（ミリ秒）
  SLOW_FILTER_THRESHOLD_MS: typeof ENV.env.isProd === 'boolean' && ENV.env.isProd ? 300 : 100,
  // サンプリングレート設定
  LOG_SAMPLING_RATE: typeof ENV.env.isProd === 'boolean' && ENV.env.isProd ? 20 : 5,
  // 結果が有意にフィルタリングされたと判断する閾値（元のデータ量に対する比率）
  SIGNIFICANT_FILTER_RATIO: 0.9,
};

// モジュールのトップレベルでロガーを設定（コンポーネントインスタンス毎にではなく一度だけ）
logger.configure({
  samplingRates: {
    poi_filtering: PERFORMANCE_CONFIG.LOG_SAMPLING_RATE,
  },
});

/**
 * カテゴリフィルタリングのロジック
 * @param poi 対象のPOI
 * @param categories フィルタリング対象のカテゴリ配列
 * @returns 選択されたカテゴリに一致する場合はtrue
 */
const matchesCategory = (poi: PointOfInterest, categories: string[] | undefined): boolean => {
  // カテゴリが未指定または空の場合は全て対象
  if (!categories || categories.length === 0) return true;

  // POIのcategoriesがない場合は一致しない
  if (!poi.categories || poi.categories.length === 0) return false;

  // いずれかのカテゴリが一致すればtrue
  return poi.categories.some(category => categories.includes(category));
};

/**
 * 営業状態フィルタリングのロジック
 * @param poi 対象のPOI
 * @returns 現在営業中であればtrue
 */
const isOpenNow = (poi: PointOfInterest): boolean => {
  // 永久閉店している場合はfalse
  if (poi.isClosed === true) return false;

  // 現在の曜日が定休日かチェック
  const now = new Date();
  const day = now.getDay();
  const dayNames = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];
  const currentDayName = dayNames[day];

  // 型安全に動的プロパティにアクセス
  const closedKey = `${currentDayName}定休日` as keyof PointOfInterest;
  return poi[closedKey] !== true;
};

/**
 * 検索テキスト正規化関数
 * @param searchText 検索テキスト
 * @returns 正規化された検索テキスト
 */
const normalizeSearchText = (searchText: string | undefined): string | undefined => {
  // 明示的にundefinedをチェック
  if (searchText === undefined) return undefined;
  // 明示的に空文字列をチェック
  if (searchText.trim() === '') return undefined;
  return searchText.toLowerCase().trim();
};

/**
 * テキスト検索フィルタリングのロジック
 * @param poi 対象のPOI
 * @param searchText 検索テキスト（正規化済み）
 * @returns 検索テキストが含まれる場合はtrue
 */
const matchesSearchText = (poi: PointOfInterest, searchText: string | undefined): boolean => {
  // 明示的にundefinedをチェック
  if (searchText === undefined) return true;
  // 明示的に空文字列をチェック
  if (searchText === '') return true;

  // searchTextプロパティがある場合はそれを優先的に使用
  if (typeof poi.searchText === 'string' && poi.searchText !== '') {
    return poi.searchText.includes(searchText);
  }

  // 個別のプロパティを検索（正規化済みでコンパクトに）
  const searchTargets = [
    poi.name.toLowerCase(),
    typeof poi.genre === 'string' ? poi.genre.toLowerCase() : '',
    poi.address.toLowerCase(),
  ];

  // いずれかの項目にsearchTextが含まれればtrue
  return searchTargets.some(target => target.includes(searchText));
};

/**
 * POIのフィルタリングを実行する関数（純粋関数）
 */
const filterPOIs = (
  pois: PointOfInterest[],
  filters: FilterOptions,
  normalizedSearchText?: string
): PointOfInterest[] => {
  // 入力データが空の場合は早期リターン
  if (pois.length === 0) return [];

  // フィルタリング前の最適化 - コスト計算とフィルタ順序決定
  const hasCategoryFilter = filters.categories !== undefined && filters.categories.length > 0;
  const hasOpenFilter = filters.isOpen === true;
  const hasSearchFilter = normalizedSearchText !== undefined;

  // フィルタが何もない場合は元の配列をそのまま返す（参照の同一性を維持）
  if (!hasCategoryFilter && !hasOpenFilter && !hasSearchFilter) {
    return pois;
  }

  // コスト評価に基づくフィルタリング順序の最適化
  return pois.filter(poi => {
    try {
      // 早期リターン戦略：コスト低・除外効果高の順に評価
      if (hasOpenFilter && !isOpenNow(poi)) return false;
      if (hasCategoryFilter && !matchesCategory(poi, filters.categories)) return false;
      if (hasSearchFilter && !matchesSearchText(poi, normalizedSearchText)) return false;

      return true;
    } catch (error) {
      // エラーログを記録し、問題のあるPOIは除外
      logger.warn(`POI フィルタリングエラー`, {
        component: COMPONENT_NAME,
        action: 'filter_error',
        entityId: poi.id || 'unknown',
        poiName: poi.name || 'unknown',
        error:
          error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
        categories: poi.categories,
        isClosed: poi.isClosed,
      });
      return false;
    }
  });
};

/**
 * POIフィルタリング結果を記録するヘルパー関数
 */
const logFilteringResults = (
  baseLogContext: FilterLogContext,
  pois: PointOfInterest[],
  result: PointOfInterest[],
  prevResultSize: number | null
): number => {
  const resultRatio = pois.length > 0 ? result.length / pois.length : 0;
  const isSignificantFiltering = resultRatio < PERFORMANCE_CONFIG.SIGNIFICANT_FILTER_RATIO;

  // 前回との変化傾向を計算
  let trend: string | undefined;
  if (prevResultSize !== null) {
    if (result.length > prevResultSize) {
      trend = 'increase';
    } else if (result.length < prevResultSize) {
      trend = 'decrease';
    } else {
      trend = 'stable';
    }
  }

  logger.debug('POIフィルタリング完了', {
    ...baseLogContext,
    action: 'filter_complete',
    filteredCount: result.length,
    excludedCount: pois.length - result.length,
    filterRatio: Number(resultRatio.toFixed(4)),
    isSignificantFiltering,
    trend,
    performanceClass: result.length > 1000 ? 'large' : result.length > 100 ? 'medium' : 'small',
  });

  return result.length;
};

/**
 * パフォーマンス計測付きでPOIフィルタリングを実行するヘルパー関数
 */
const filterPOIsWithPerfTracking = (
  pois: PointOfInterest[],
  filters: FilterOptions,
  normalizedSearchText: string | undefined,
  baseLogContext: FilterLogContext,
  lastExecutionTime: number | null
): { result: PointOfInterest[]; executionTime: number; performanceChangeRate: string | null } => {
  const startTime = performance.now();

  // パフォーマンス計測付きでフィルタリング実行
  const result = logger.measureTime(
    'POIフィルタリング処理',
    () => filterPOIs(pois, filters, normalizedSearchText),
    LogLevel.DEBUG,
    {
      ...baseLogContext,
      action: 'filter_execute',
      thresholdMs: PERFORMANCE_CONFIG.SLOW_FILTER_THRESHOLD_MS,
    }
  );

  const executionTime = performance.now() - startTime;

  // 前回からのパフォーマンス変化率を計算
  let performanceChangeRate: string | null = null;
  if (lastExecutionTime !== null && lastExecutionTime > 0) {
    const changePercent = Math.round(
      ((executionTime - lastExecutionTime) / lastExecutionTime) * 100
    );
    performanceChangeRate = `${(changePercent > 0 ? '+' : '') + changePercent}%`;
  }

  return { result, executionTime, performanceChangeRate };
};

/**
 * POIデータをフィルタリングするカスタムフック
 *
 * 指定された条件に基づいてPOIをフィルタリングし、結果をメモ化して返します。
 * フィルタリング条件が変更されない限り、同じ参照の配列が返されるため、
 * 不要な再レンダリングを防止します。
 *
 * @param pois フィルタリング対象のPOIデータ配列
 * @param filters フィルタリング条件
 * @returns フィルタリングされたPOI配列
 *
 * @example
 * ```tsx
 * const { categories, isOpen, searchText } = useFilterState();
 * const filteredPOIs = useFilteredPOIs(pois, { categories, isOpen, searchText });
 * ```
 */
export function useFilteredPOIs(
  pois: PointOfInterest[],
  filters: FilterOptions = {}
): PointOfInterest[] {
  // サンプリングレート制御用のカウンター
  const sampleCounterRef = useRef(0);
  // 前回のフィルタリング結果サイズを保存（パフォーマンス傾向の分析用）
  const prevResultSizeRef = useRef<number | null>(null);
  // 前回の実行時間を保存
  const prevExecutionTimeRef = useRef<number | null>(null);

  // 検索テキストを正規化（メモ化の最適化のため）
  const normalizedSearchText = useMemo(
    () => normalizeSearchText(filters.searchText),
    [filters.searchText]
  );

  // フィルタリング設定の安定した参照を作成
  // exactOptionalPropertyTypes: true に対応するために、明示的に undefined を含む型を処理
  const stableFilters = useMemo(
    () =>
      ({
        // 明示的に undefined の可能性を考慮した型安全な割り当て
        categories: filters.categories ?? undefined,
        isOpen: filters.isOpen ?? undefined,
      }) as FilterOptions,
    [filters.categories, filters.isOpen]
  );

  // ベースログコンテキスト生成関数をメモ化
  const createBaseLogContext = useCallback(
    (batchId: string): FilterLogContext => ({
      component: COMPONENT_NAME,
      batchId,
      environment: typeof ENV.env.mode === 'string' ? ENV.env.mode : 'unknown',
      inputSize: pois.length,
      entityId: `filter-${batchId}`,
      action: 'poi_filtering',
      filterConfig: {
        categoriesCount: stableFilters.categories?.length ?? 0,
        isOpen: stableFilters.isOpen === true,
        hasSearchText: normalizedSearchText !== undefined,
      },
    }),
    [pois.length, stableFilters, normalizedSearchText]
  );

  return useMemo(() => {
    // サンプリングレート制御 - N回に1回だけログを出力
    const shouldLog = ++sampleCounterRef.current % PERFORMANCE_CONFIG.LOG_SAMPLING_RATE === 0;
    const batchId = `filter-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 基本ログコンテキスト - 条件付きで生成（ログを出力する場合のみ）
    const baseLogContext = shouldLog ? createBaseLogContext(batchId) : null;

    // フィルタリング開始ログ（サンプリングレートに基づく）
    if (shouldLog && baseLogContext) {
      logger.debug('POIフィルタリング開始', {
        ...baseLogContext,
        action: 'filter_start',
      });
    }

    // フィルタリング処理実行（ログ有効時はパフォーマンス測定付き）
    let result: PointOfInterest[];

    if (shouldLog && baseLogContext) {
      const perfTrackingResult = filterPOIsWithPerfTracking(
        pois,
        stableFilters,
        normalizedSearchText,
        baseLogContext,
        prevExecutionTimeRef.current
      );

      result = perfTrackingResult.result;
      prevExecutionTimeRef.current = perfTrackingResult.executionTime;

      // 結果の統計情報をログに記録
      prevResultSizeRef.current = logFilteringResults(
        baseLogContext,
        pois,
        result,
        prevResultSizeRef.current
      );
    } else {
      // ログ無効時は直接実行
      result = filterPOIs(pois, stableFilters, normalizedSearchText);
    }

    return result;
  }, [pois, normalizedSearchText, stableFilters, createBaseLogContext]);
}
