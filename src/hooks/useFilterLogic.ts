import { useState, useCallback, useMemo, useEffect } from 'react';

import { PointOfInterest } from '@/types/poi';

export type StatusFilter = 'all' | 'open' | 'closed';

export interface FilterState {
  categoryFilters: Record<string, boolean>;
  districtFilters: Record<string, boolean>;
  statusFilter: StatusFilter;
  searchText: string;
}

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

// 共通の選択状態変更ロジックを抽出
const useFilterSelection = () => {
  // 全選択/全解除ハンドラの生成関数
  const createToggleHandler = useCallback(
    (
      items: string[],
      setFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    ) => {
      return (select: boolean) => {
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

// POIをフィルタリングする関数
const filterPOIs = (
  pois: PointOfInterest[],
  categoryFilters: Record<string, boolean>,
  districtFilters: Record<string, boolean>,
  statusFilter: StatusFilter,
  searchText: string
): PointOfInterest[] => {
  return pois.filter(poi => {
    // カテゴリ・地区フィルタ
    if (poi.category && !categoryFilters[poi.category]) return false;
    if (poi.district && !districtFilters[poi.district]) return false;

    // 営業状態フィルタ
    if (statusFilter === 'open' && poi.isClosed) return false;
    if (statusFilter === 'closed' && !poi.isClosed) return false;

    // テキスト検索フィルタ
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        poi.name.toLowerCase().includes(searchLower) ||
        poi.address.toLowerCase().includes(searchLower) ||
        (poi.genre?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return true;
  });
};

// ユニークカテゴリと地区を抽出する関数
const extractUniqueValues = (pois: PointOfInterest[]) => {
  const categoriesSet = new Set<string>();
  const districtsSet = new Set<string>();

  pois.forEach(poi => {
    if (poi.category) categoriesSet.add(poi.category);
    if (poi.district) districtsSet.add(poi.district);
  });

  return {
    categories: Array.from(categoriesSet).sort(),
    districts: Array.from(districtsSet).sort(),
  };
};

export function useFilterLogic(
  pois: PointOfInterest[],
  onFilterChange: (filteredPois: PointOfInterest[]) => void
): FilterLogicResult {
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
    onFilterChange(filteredPois);
  }, [pois, categoryFilters, districtFilters, statusFilter, searchText, onFilterChange]);

  // フィルタ変更時の処理
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // フィルタをリセットするハンドラ
  const handleResetFilters = useCallback(() => {
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
