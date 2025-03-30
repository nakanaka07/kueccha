import { useMemo } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';

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

/**
 * カテゴリフィルタリングのロジック
 * @param poi 対象のPOI
 * @param categories フィルタリング対象のカテゴリ配列
 * @returns 選択されたカテゴリに一致する場合はtrue
 */
const matchesCategory = (poi: PointOfInterest, categories?: string[]): boolean => {
  // カテゴリが未指定の場合は全て対象
  if (!categories?.length) return true;

  // POIのcategoriesが未定義の場合はfalse
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
  // 永久閉店している場合
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
 * テキスト検索フィルタリングのロジック
 * @param poi 対象のPOI
 * @param searchText 検索テキスト
 * @returns 検索テキストが含まれる場合はtrue
 */
const matchesSearchText = (poi: PointOfInterest, searchText?: string): boolean => {
  // 検索テキストが未指定の場合は全て対象
  if (!searchText) return true;

  const searchLower = searchText.toLowerCase();

  // 各プロパティの型に合わせて適切にアクセス
  // searchTextプロパティがある場合はそれを優先的に使用
  if (poi.searchText) {
    return poi.searchText.includes(searchLower);
  }

  // searchTextがない場合は個別のプロパティを検索
  const name = poi.name.toLowerCase();
  const genre = poi.genre?.toLowerCase() ?? '';
  const address = poi.address.toLowerCase();

  return name.includes(searchLower) || genre.includes(searchLower) || address.includes(searchLower);
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
  return useMemo(() => {
    // 入力データが空の場合は早期リターン
    if (!pois.length) return [];

    logger.debug('POIフィルタリング開始', {
      total: pois.length,
      filters: {
        categoriesCount: filters.categories?.length,
        isOpen: filters.isOpen,
        hasSearchText: !!filters.searchText,
      },
      component: 'useFilteredPOIs',
    });

    // フィルタリング処理の性能を計測
    const result = logger.measureTime(
      'POIフィルタリング処理',
      () => {
        // 全てのフィルターを適用して結果を返す
        return pois.filter(poi => {
          try {
            // カテゴリフィルター
            if (!matchesCategory(poi, filters.categories)) return false;

            // 営業状態フィルター
            if (filters.isOpen && !isOpenNow(poi)) return false;

            // テキスト検索フィルター
            if (!matchesSearchText(poi, filters.searchText)) return false;

            return true;
          } catch (error) {
            // フィルタリング中のエラーを記録し、エラーが発生したPOIは除外
            logger.warn(`POI '${poi.name}' のフィルタリング中にエラーが発生しました`, {
              poiId: poi.id,
              error: error instanceof Error ? error.message : String(error),
              component: 'useFilteredPOIs',
            });
            return false;
          }
        });
      },
      LogLevel.DEBUG,
      { component: 'useFilteredPOIs' }
    );

    // フィルタリング結果をログに記録
    logger.debug('POIフィルタリング完了', {
      filteredCount: result.length,
      excludedCount: pois.length - result.length,
      component: 'useFilteredPOIs',
    });

    return result;
  }, [pois, filters.categories, filters.isOpen, filters.searchText]);
}
