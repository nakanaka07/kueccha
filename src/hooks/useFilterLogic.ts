import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import type { PointOfInterest } from '@/types/poi-types';
import { logger, LogLevel } from '@/utils/logger';

// コンポーネント名を定数として定義（ロガー用）
const COMPONENT_NAME = 'useFilterLogic';

/**
 * ステータスフィルターの型定義
 */
export type StatusFilter = 'all' | 'open' | 'closed';

/**
 * フィルター状態の型定義
 */
export interface FilterState {
  categoryFilters: Map<string, boolean>; // Record<string, boolean> から Map に変更
  districtFilters: Map<string, boolean>; // Record<string, boolean> から Map に変更
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
 * テキスト検索条件に基づいてPOIをフィルタリングする関数
 * 頻繁に呼び出されるのでインライン化は避けて再利用
 */
const matchesSearchText = (poi: PointOfInterest, searchLower: string): boolean => {
  if (searchLower === '') return true;

  // PointOfInterest uses optional genre
  const genreMatch = typeof poi.genre === 'string' && poi.genre.toLowerCase().includes(searchLower);
  const nameMatch = poi.name.toLowerCase().includes(searchLower);
  const addressMatch = poi.address.toLowerCase().includes(searchLower);

  return nameMatch || addressMatch || genreMatch;
};

/**
 * 共通の選択状態変更ロジックを提供するカスタムフック
 * useFilterLogic外に分離してメモリ効率を向上
 */
const useFilterSelection = () => {
  // 全選択/全解除ハンドラの生成関数
  const createToggleHandler = useCallback(
    (
      items: string[],
      setFilters: React.Dispatch<React.SetStateAction<Map<string, boolean>>> // Record から Map に変更
    ) => {
      return (select: boolean) => {
        logger.debug('フィルター全選択/解除', {
          component: COMPONENT_NAME,
          action: 'toggle_all',
          itemCount: items.length,
          select,
        });

        const updated = new Map<string, boolean>(); // Record から Map に変更
        items.forEach(item => {
          updated.set(item, select); // オブジェクト代入から Map.set に変更
        });
        setFilters(updated); // 新しい Map をセット
      };
    },
    []
  );
  // 単一項目のチェック状態変更ハンドラを生成する関数
  const createChangeHandler = useCallback(
    (setFilters: React.Dispatch<React.SetStateAction<Map<string, boolean>>>) => {
      // Record から Map に変更
      return (item: string, checked: boolean) => {
        if (process.env.NODE_ENV !== 'production') {
          logger.debug('フィルター項目変更', {
            component: COMPONENT_NAME,
            action: 'change_item',
            item,
            checked,
          });
        }

        setFilters(prev => {
          const next = new Map(prev); // イミュータビリティのため新しい Map を作成
          next.set(item, checked); // Map.set で更新
          return next;
        });
      };
    },
    []
  );

  return { createToggleHandler, createChangeHandler };
};

/**
 * ユニークカテゴリと地区を抽出する関数
 * useMemoで呼び出す前提で最適化
 */
const extractUniqueValues = (pois: PointOfInterest[]) => {
  if (!pois.length) return { categories: [], districts: [] };

  const categoriesSet = new Set<string>();
  const districtsSet = new Set<string>();

  pois.forEach(poi => {
    // Use optional chaining for category and district in PointOfInterest
    if (typeof poi.category === 'string' && poi.category) categoriesSet.add(poi.category);
    if (typeof poi.district === 'string' && poi.district) districtsSet.add(poi.district);
  });

  return {
    categories: Array.from(categoriesSet).sort(),
    districts: Array.from(districtsSet).sort(),
  };
};

/**
 * POIをフィルタリングする関数
 * 重要な処理なのでuseMemoでメモ化して再利用
 */
const filterPOIs = (
  pois: PointOfInterest[],
  categoryFilters: Map<string, boolean>,
  districtFilters: Map<string, boolean>,
  statusFilter: StatusFilter,
  searchText: string
): PointOfInterest[] => {
  return logger.measureTime(
    'POIのフィルタリング処理',
    () => {
      if (!pois.length) return [];

      const searchLower = searchText.toLowerCase();

      // 実際に true の値を持つフィルターがあるかチェック
      const hasActiveCategoryFilter = Array.from(categoryFilters.values()).some(v => v);
      const hasActiveDistrictFilter = Array.from(districtFilters.values()).some(v => v);

      // フィルタリング実行前にログ記録
      logger.debug('POIフィルタリング開始', {
        component: COMPONENT_NAME,
        action: 'filter_pois',
        poiCount: pois.length,
        statusFilter,
        searchTextLength: searchText.length,
      });

      return pois.filter(poi => {
        // カテゴリフィルター (アクティブなフィルターがあり、選択されていない場合は除外)
        if (hasActiveCategoryFilter && poi.category && !categoryFilters.get(poi.category)) {
          return false;
        }

        // 地区フィルター (アクティブなフィルターがあり、選択されていない場合は除外)
        if (hasActiveDistrictFilter && poi.district && !districtFilters.get(poi.district)) {
          return false;
        }

        // 営業状態フィルター
        if (statusFilter !== 'all') {
          const isOpen = !poi.isClosed; // isClosed フラグを使用
          if (statusFilter === 'open' && !isOpen) return false;
          if (statusFilter === 'closed' && isOpen) return false;
        }

        // テキスト検索フィルター
        if (!matchesSearchText(poi, searchLower)) {
          return false;
        }

        return true;
      });
    },
    LogLevel.DEBUG // 単純にLogLevelの値のみを渡す
  );
};

/**
 * POIリストとフィルター変更コールバックを受け取り、フィルターロジックを提供するカスタムフック
 *
 * @param pois PointOfInterest[] - フィルタリング対象のPOIリスト
 * @param onFilterChange (filteredPois: PointOfInterest[]) => void - フィルター結果が変更されたときに呼び出されるコールバック
 * @returns FilterLogicResult - フィルター状態と操作関数を含むオブジェクト
 */
export const useFilterLogic = (
  pois: PointOfInterest[],
  onFilterChange: (filteredPois: PointOfInterest[]) => void
): FilterLogicResult => {
  logger.debug('useFilterLogic が呼び出されました', {
    component: COMPONENT_NAME,
    action: 'hook_init',
    poisCount: pois.length,
  });

  // 状態を Map で初期化
  const [categoryFilters, setCategoryFilters] = useState<Map<string, boolean>>(() => new Map());
  const [districtFilters, setDistrictFilters] = useState<Map<string, boolean>>(() => new Map());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');

  const { categories, districts } = useMemo(() => extractUniqueValues(pois), [pois]);

  // Initialize filters when categories/districts change
  useEffect(() => {
    setCategoryFilters(prev => {
      const next = new Map(prev);
      let changed = false;
      categories.forEach(cat => {
        if (!next.has(cat)) {
          next.set(cat, true);
          changed = true;
        }
      });
      // Remove categories that no longer exist
      Array.from(next.keys()).forEach(key => {
        if (!categories.includes(key)) {
          next.delete(key);
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    setDistrictFilters(prev => {
      const next = new Map(prev);
      let changed = false;
      districts.forEach(dist => {
        if (!next.has(dist)) {
          next.set(dist, true);
          changed = true;
        }
      });
      // Remove districts that no longer exist
      Array.from(next.keys()).forEach(key => {
        if (!districts.includes(key)) {
          next.delete(key);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [categories, districts]);

  const { createToggleHandler, createChangeHandler } = useFilterSelection();

  const handleCategoryChange = createChangeHandler(setCategoryFilters);
  const handleDistrictChange = createChangeHandler(setDistrictFilters);
  const handleToggleAllCategories = createToggleHandler(categories, setCategoryFilters);
  const handleToggleAllDistricts = createToggleHandler(districts, setDistrictFilters);
  // Debounce filter changes slightly to avoid rapid updates during typing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const filteredPOIs = useMemo(() => {
    return filterPOIs(pois, categoryFilters, districtFilters, statusFilter, searchText);
  }, [pois, categoryFilters, districtFilters, statusFilter, searchText]);

  // Call onFilterChange when filteredPOIs changes (debounced)
  useEffect(() => {
    // フィルター結果に変更があった場合のみデバウンスタイマーを設定
    const debouncedHandler = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        onFilterChange(filteredPOIs);
        debounceTimeoutRef.current = null; // タイマー参照をクリア
      }, 50); // 50ms debounce
    };

    debouncedHandler();

    // クリーンアップ関数
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [filteredPOIs, onFilterChange]);

  const handleResetFilters = useCallback(() => {
    setCategoryFilters(prev => {
      const next = new Map(prev);
      categories.forEach(cat => next.set(cat, true));
      return next;
    });
    setDistrictFilters(prev => {
      const next = new Map(prev);
      districts.forEach(dist => next.set(dist, true));
      return next;
    });
    setStatusFilter('all');
    setSearchText('');
    logger.info('フィルターリセット完了', {
      component: COMPONENT_NAME,
      action: 'reset_filters_complete',
    });
  }, [categories, districts]);

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
};
