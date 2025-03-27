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
      // カテゴリフィルタリング
      if (filters.categories?.length) {
        // POIがカテゴリを持つか確認し、フィルタカテゴリとの一致をチェック
        if (!poi.categories?.some(category => filters.categories?.includes(category))) {
          return false;
        }
      }

      // 営業中フィルタリング
      if (filters.isOpen) {
        // 永久閉店している場合は除外
        if (poi.isClosed) return false;

        // 現在の曜日が定休日かチェック
        const now = new Date();
        const day = now.getDay();
        const dayNames = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];
        const currentDayName = dayNames[day];

        // 型安全に動的プロパティにアクセス
        // 例: 「月曜定休日」プロパティが true の場合、月曜日は除外
        const closedKey = `${currentDayName}定休日` as keyof PointOfInterest;
        if (poi[closedKey] === true) return false;
      }

      // テキストフィルタリング
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();

        // 検索対象フィールドの値を取得（存在しない場合は空文字列）
        const name = poi.name.toLowerCase() || '';
        const genre = poi.genre?.toLowerCase() || '';
        const address = poi.address.toLowerCase() || '';

        // 名称、ジャンル、住所のいずれかにマッチするか
        const nameMatch = name.includes(searchLower);
        const genreMatch = genre.includes(searchLower);
        const addressMatch = address.includes(searchLower);

        if (!(nameMatch || genreMatch || addressMatch)) {
          return false;
        }
      }

      // すべての条件を満たした場合のみtrueを返す
      return true;
    });
  }, [pois, filters.categories, filters.isOpen, filters.searchText]);
}