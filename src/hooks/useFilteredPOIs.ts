import { useMemo } from 'react';

import { PointOfInterest } from '@/types/poi';

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
 */
const matchesCategory = (poi: PointOfInterest, categories?: string[]): boolean => {
  if (!categories?.length) return true;
  return !!poi.categories?.some(category => categories.includes(category));
};

/**
 * 営業状態フィルタリングのロジック
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
 */
const matchesSearchText = (poi: PointOfInterest, searchText?: string): boolean => {
  if (!searchText) return true;

  const searchLower = searchText.toLowerCase();

  // 各プロパティの型に合わせて適切にアクセス
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

    return pois.filter(poi => {
      // すべてのフィルター条件を適用
      if (!matchesCategory(poi, filters.categories)) return false;
      if (filters.isOpen && !isOpenNow(poi)) return false;
      if (!matchesSearchText(poi, filters.searchText)) return false;

      return true;
    });
  }, [pois, filters.categories, filters.isOpen, filters.searchText]);
}
