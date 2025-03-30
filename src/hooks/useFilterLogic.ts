import { useState, useCallback, useMemo, useEffect } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';

/**
 * ステータスフィルターの型定義
 */
export type StatusFilter = 'all' | 'open' | 'closed';

/**
 * フィルター状態の型定義
 */
export interface FilterState {
  categoryFilters: Record<string, boolean>;
  districtFilters: Record<string, boolean>;
  statusFilter: StatusFilter;
  searchText: string;
}

/**
 * フィルターロジック結果の型定義
 */
export interface FilterLogicResult extends FilterState {
  categories: string[];
  districts: string[];
  setSearchText: (text: string) => void;
  setStatusFilter: (status: StatusFilter) => void;
  handleCategoryChange: (category: string, checked: boolean) => void;
  handleDistrictChange: (district: string, checked: boolean) => void;
  handleToggleAllCategories: (select: boolean) => void;
  handleToggleAllDistricts: (select: boolean) => void;
  handleResetFilters: () => void;
}

/**
 * 共通の選択状態変更ロジックを提供するカスタムフック
 */
const useFilterSelection = () => {
  // 全選択/全解除ハンドラの生成関数
  const createToggleHandler = useCallback(
    (
      items: string[],
      setFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    ) => {
      return (select: boolean) => {
        logger.debug('フィルター全選択/解除', { itemCount: items.length, select });

        const updated: Record<string, boolean> = {};
        items.forEach(item => {
          updated[item] = select;
        });
        setFilters(updated);
      };
    },
    []
  );

  // 単一項目のチェック状態変更ハンドラを生成する関数
  const createChangeHandler = useCallback(
    (setFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) => {
      return (item: string, checked: boolean) => {
        logger.debug('フィルター項目変更', { item, checked });

        setFilters(prev => ({
          ...prev,
          [item]: checked,
        }));
      };
    },
    []
  );

  return { createToggleHandler, createChangeHandler };
};

/**
 * テキスト検索条件に基づいてPOIをフィルタリングする関数
 */
const matchesSearchText = (poi: PointOfInterest, searchLower: string): boolean => {
  if (!searchLower) return true;

  return (
    poi.name.toLowerCase().includes(searchLower) ||
    poi.address.toLowerCase().includes(searchLower) ||
    !!poi.genre?.toLowerCase().includes(searchLower)
  );
};

/**
 * POIをフィルタリングする関数
 */
const filterPOIs = (
  pois: PointOfInterest[],
  categoryFilters: Record<string, boolean>,
  districtFilters: Record<string, boolean>,
  statusFilter: StatusFilter,
  searchText: string
): PointOfInterest[] => {
  return logger.measureTime(
    'POIのフィルタリング処理',
    () => {
      const searchLower = searchText.toLowerCase().trim();

      const filteredResults = pois.filter(poi => {
        // カテゴリ・地区フィルタ
        if (poi.category && !categoryFilters[poi.category]) return false;
        if (poi.district && !districtFilters[poi.district]) return false;

        // 営業状態フィルタ
        if (statusFilter === 'open' && poi.isClosed) return false;
        if (statusFilter === 'closed' && !poi.isClosed) return false;

        // テキスト検索フィルタ
        return matchesSearchText(poi, searchLower);
      });

      return filteredResults;
    },
    LogLevel.DEBUG,
    { totalPOIs: pois.length }
  );
};

/**
 * ユニークカテゴリと地区を抽出する関数
 */
const extractUniqueValues = (pois: PointOfInterest[]) => {
  return logger.measureTime(
    'ユニークカテゴリと地区の抽出',
    () => {
      const categoriesSet = new Set<string>();
      const districtsSet = new Set<string>();

      pois.forEach(poi => {
        if (poi.category) categoriesSet.add(poi.category);
        if (poi.district) districtsSet.add(poi.district);
      });

      // 並び替えしたカテゴリと地区の配列を返す
      return {
        categories: Array.from(categoriesSet).sort(),
        districts: Array.from(districtsSet).sort(),
      };
    },
    LogLevel.DEBUG
  );
};

/**
 * POIフィルタリングロジックを提供するカスタムフック
 *
 * @param pois フィルタリング対象のPOI配列
 * @param onFilterChange フィルタリング結果の変更時に呼び出されるコールバック
 * @returns フィルタリング状態と操作メソッドを含むオブジェクト
 */
export function useFilterLogic(
  pois: PointOfInterest[],
  onFilterChange: (filteredPois: PointOfInterest[]) => void
): FilterLogicResult {
  logger.debug('useFilterLogic が呼び出されました', { poisCount: pois.length });

  // フィルター状態
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({});
  const [districtFilters, setDistrictFilters] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');

  // POIデータからユニークなカテゴリーと地区を抽出
  const { categories, districts } = useMemo(() => extractUniqueValues(pois), [pois]);

  // フィルター選択状態管理ロジック
  const { createToggleHandler, createChangeHandler } = useFilterSelection();

  // カテゴリーとディストリクト用のハンドラ
  const handleCategoryChange = useCallback(
    (category: string, checked: boolean) =>
      createChangeHandler(setCategoryFilters)(category, checked),
    [createChangeHandler]
  );

  const handleDistrictChange = useCallback(
    (district: string, checked: boolean) =>
      createChangeHandler(setDistrictFilters)(district, checked),
    [createChangeHandler]
  );

  const handleToggleAllCategories = useCallback(
    (select: boolean) => createToggleHandler(categories, setCategoryFilters)(select),
    [createToggleHandler, categories]
  );

  const handleToggleAllDistricts = useCallback(
    (select: boolean) => createToggleHandler(districts, setDistrictFilters)(select),
    [createToggleHandler, districts]
  );

  // 初期化時にすべてのカテゴリと地区を選択状態にする
  useEffect(() => {
    logger.info('フィルターの初期化', {
      categoriesCount: categories.length,
      districtsCount: districts.length,
    });

    handleToggleAllCategories(true);
    handleToggleAllDistricts(true);
  }, [categories, districts, handleToggleAllCategories, handleToggleAllDistricts]);

  // フィルタリング処理
  const applyFilters = useCallback(() => {
    const filteredPois = filterPOIs(
      pois,
      categoryFilters,
      districtFilters,
      statusFilter,
      searchText
    );

    logger.info('フィルター適用結果', {
      totalPOIs: pois.length,
      filteredCount: filteredPois.length,
      categoryFiltersCount: Object.values(categoryFilters).filter(Boolean).length,
      districtFiltersCount: Object.values(districtFilters).filter(Boolean).length,
      statusFilter,
      hasSearchText: !!searchText,
    });

    onFilterChange(filteredPois);
  }, [pois, categoryFilters, districtFilters, statusFilter, searchText, onFilterChange]);

  // フィルタ変更時の処理
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // フィルタをリセットするハンドラ
  const handleResetFilters = useCallback(() => {
    logger.info('フィルターをリセット');

    handleToggleAllCategories(true);
    handleToggleAllDistricts(true);
    setStatusFilter('all');
    setSearchText('');
  }, [handleToggleAllCategories, handleToggleAllDistricts]);

  return {
    categoryFilters,
    districtFilters,
    statusFilter,
    searchText,
    categories,
    districts,
    setSearchText,
    setStatusFilter,
    handleCategoryChange,
    handleDistrictChange,
    handleToggleAllCategories,
    handleToggleAllDistricts,
    handleResetFilters,
  };
}
