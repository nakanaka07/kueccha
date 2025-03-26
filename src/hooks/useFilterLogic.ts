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
  const { categories, districts } = useMemo(() => {
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
  }, [pois]);

  // 初期化時にすべてのカテゴリと地区を選択状態にする
  useEffect(() => {
    const initialCategoryFilters: Record<string, boolean> = {};
    const initialDistrictFilters: Record<string, boolean> = {};

    categories.forEach(category => {
      initialCategoryFilters[category] = true;
    });

    districts.forEach(district => {
      initialDistrictFilters[district] = true;
    });

    setCategoryFilters(initialCategoryFilters);
    setDistrictFilters(initialDistrictFilters);
  }, [categories, districts]);

  // フィルタリング処理
  const applyFilters = useCallback(() => {
    const filtered = pois.filter(poi => {
      // カテゴリフィルタ
      if (poi.category && !categoryFilters[poi.category]) return false;

      // 地区フィルタ
      if (poi.district && !districtFilters[poi.district]) return false;

      // 営業状態フィルタ
      if (statusFilter === 'open' && poi.isClosed) return false;
      if (statusFilter === 'closed' && !poi.isClosed) return false;

      // テキスト検索フィルタ
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const nameMatch = poi.name.toLowerCase().includes(searchLower);
        const addressMatch = poi.address.toLowerCase().includes(searchLower);
        const genreMatch = poi.genre?.toLowerCase().includes(searchLower);

        if (!(nameMatch || addressMatch || genreMatch)) return false;
      }

      return true;
    });

    onFilterChange(filtered);
  }, [pois, categoryFilters, districtFilters, statusFilter, searchText, onFilterChange]);

  // フィルタ変更時の処理
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // カテゴリフィルタの変更ハンドラ
  const handleCategoryChange = useCallback((category: string, checked: boolean) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: checked,
    }));
  }, []);

  // 地区フィルタの変更ハンドラ
  const handleDistrictChange = useCallback((district: string, checked: boolean) => {
    setDistrictFilters(prev => ({
      ...prev,
      [district]: checked,
    }));
  }, []);

  // すべてのカテゴリを選択/解除するハンドラ
  const handleToggleAllCategories = useCallback(
    (select: boolean) => {
      const updated: Record<string, boolean> = {};
      categories.forEach(category => {
        updated[category] = select;
      });
      setCategoryFilters(updated);
    },
    [categories]
  );

  // すべての地区を選択/解除するハンドラ
  const handleToggleAllDistricts = useCallback(
    (select: boolean) => {
      const updated: Record<string, boolean> = {};
      districts.forEach(district => {
        updated[district] = select;
      });
      setDistrictFilters(updated);
    },
    [districts]
  );

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
