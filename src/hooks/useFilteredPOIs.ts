import { useMemo, useRef } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';
import { ENV } from '@/utils/env';

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

// 環境変数から取得したパフォーマンス設定
const PERFORMANCE_CONFIG = {
  // フィルタリング処理時間の警告閾値（ミリ秒）
  // 指定時間を超えた場合は警告ログを出力
  SLOW_FILTER_THRESHOLD_MS: ENV.env.isProd ? 300 : 100,
  // サンプリングレート (prod環境では20回に1回、開発環境では5回に1回ログを出力)
  LOG_SAMPLING_RATE: ENV.env.isProd ? 20 : 5,
};

// コンポーネント識別子（ログ出力で使用）
const COMPONENT_NAME = 'useFilteredPOIs';

/**
 * カテゴリフィルタリングのロジック
 * @param poi 対象のPOI
 * @param categories フィルタリング対象のカテゴリ配列
 * @returns 選択されたカテゴリに一致する場合はtrue
 */
const matchesCategory = (poi: PointOfInterest, categories?: string[]): boolean => {
  // カテゴリが未指定の場合は全て対象（早期リターン）
  if (!categories?.length) return true;

  // POIのcategoriesが未定義の場合はfalse（早期リターン）
  if (!poi.categories?.length) return false;

  // いずれかのカテゴリが一致すればtrue
  return poi.categories.some(category => categories.includes(category));
};

/**
 * 営業状態フィルタリングのロジック
 * @param poi 対象のPOI
 * @returns 現在営業中であればtrue
 */
const isOpenNow = (poi: PointOfInterest): boolean => {
  // 永久閉店している場合は早期リターン
  if (poi.isClosed) return false;

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
 * searchTextの正規化を行いキャッシュの効率性を高める
 * @param searchText 検索テキスト
 * @returns 正規化された検索テキスト
 */
const normalizeSearchText = (searchText?: string): string | undefined => {
  if (!searchText) return undefined;
  return searchText.toLowerCase().trim();
};

/**
 * テキスト検索フィルタリングのロジック
 * @param poi 対象のPOI
 * @param searchText 検索テキスト（正規化済み）
 * @returns 検索テキストが含まれる場合はtrue
 */
const matchesSearchText = (poi: PointOfInterest, searchText?: string): boolean => {
  // 検索テキストが未指定の場合は全て対象（早期リターン）
  if (!searchText) return true;

  // 各プロパティの型に合わせて適切にアクセス
  // searchTextプロパティがある場合はそれを優先的に使用
  if (poi.searchText) {
    return poi.searchText.includes(searchText);
  }

  // searchTextがない場合は個別のプロパティを検索
  const name = poi.name.toLowerCase();
  const genre = poi.genre?.toLowerCase() ?? '';
  const address = poi.address.toLowerCase();

  return name.includes(searchText) || genre.includes(searchText) || address.includes(searchText);
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

  // 検索テキストを正規化（メモ化の最適化のため）
  const normalizedSearchText = useMemo(
    () => normalizeSearchText(filters.searchText),
    [filters.searchText]
  );

  return useMemo(() => {
    // 入力データが空の場合は早期リターン
    if (!pois.length) return [];

    // サンプリングレート制御 - N回に1回だけログを出力
    const shouldLog = ++sampleCounterRef.current % PERFORMANCE_CONFIG.LOG_SAMPLING_RATE === 0;

    if (shouldLog) {
      logger.debug('POIフィルタリング開始', {
        total: pois.length,
        filters: {
          categoriesCount: filters.categories?.length,
          isOpen: filters.isOpen,
          hasSearchText: !!normalizedSearchText,
        },
        component: COMPONENT_NAME,
        action: 'filter_start',
      });
    }

    // フィルタリング処理の性能を計測
    const result = logger.measureTime(
      'POIフィルタリング処理',
      () => {
        // フィルタリング前の最適化 - コスト計算とフィルタ順序決定
        const hasCategoryFilter = filters.categories?.length ?? 0 > 0;
        const hasOpenFilter = filters.isOpen === true;
        const hasSearchFilter = !!normalizedSearchText;

        // フィルタが何もない場合は元の配列をそのまま返す（参照の同一性を維持）
        if (!hasCategoryFilter && !hasOpenFilter && !hasSearchFilter) {
          return pois;
        }

        // コスト評価に基づくフィルタリング順序の最適化
        // 最も計算コストが低く、除外効果が高いフィルタを先に適用
        return pois.filter(poi => {
          try {
            // 早期リターン戦略の強化 - 可能な限り早くfalseを返す
            // isOpenフィルターを優先的に実行（計算コストが低く除外効果が高いため）
            if (hasOpenFilter && !isOpenNow(poi)) return false;

            // カテゴリフィルターを次に実行
            if (hasCategoryFilter && !matchesCategory(poi, filters.categories)) return false;

            // テキスト検索フィルターを最後に実行（最もコストが高い）
            if (hasSearchFilter && !matchesSearchText(poi, normalizedSearchText)) return false;

            return true;
          } catch (error) {
            // フィルタリング中のエラーを詳細に記録し、エラーが発生したPOIは除外
            logger.warn(`POI '${poi.name}' のフィルタリング中にエラーが発生しました`, {
              poiId: poi.id,
              error:
                error instanceof Error
                  ? { message: error.message, stack: error.stack }
                  : String(error),
              component: COMPONENT_NAME,
              action: 'filter_error',
              categories: poi.categories,
              isClosed: poi.isClosed,
              // 最初のエラーのみ詳細記録
              poiDetails:
                sampleCounterRef.current === 1
                  ? {
                      name: poi.name,
                      address: poi.address,
                      type: poi.type,
                    }
                  : undefined,
            });
            return false;
          }
        });
      },
      shouldLog ? LogLevel.DEBUG : LogLevel.INFO, // NONEではなくINFOを使用（DEBUGよりも低いレベル）
      {
        component: COMPONENT_NAME,
        action: 'filter_execute',
        thresholdMs: PERFORMANCE_CONFIG.SLOW_FILTER_THRESHOLD_MS,
      }
    );

    // 結果の統計情報をサンプリングレートに基づいて記録
    if (shouldLog) {
      // フィルタリング結果比率を計算
      const resultRatio = pois.length > 0 ? result.length / pois.length : 0;
      const isSignificantFiltering = resultRatio < 0.9; // 90%以下に削減された場合は有意な絞り込みと判断

      logger.debug('POIフィルタリング完了', {
        filteredCount: result.length,
        excludedCount: pois.length - result.length,
        filterRatio: resultRatio.toFixed(2),
        isSignificantFiltering,
        component: COMPONENT_NAME,
        action: 'filter_complete',
        duration: 'measureTimeにより自動計測',
        environment: ENV.env.mode,
      });
    }

    return result;
  }, [
    pois,
    filters.categories,
    filters.isOpen,
    normalizedSearchText, // 正規化済み検索テキストを使用して再計算回数を削減
  ]);
}
