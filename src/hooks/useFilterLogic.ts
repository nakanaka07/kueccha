import { useState, useCallback, useMemo, useEffect } from 'react';

import type { PointOfInterest } from '@/types/poi';
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
 * パフォーマンスのために最適化されています
 */
const matchesSearchText = (poi: PointOfInterest, searchLower: string): boolean => {
  if (searchLower === '') return true;
  // 最も一般的なマッチ（名前）を最初にチェックしてショートサーキット評価を活用
  if (poi.name.toLowerCase().includes(searchLower)) return true;
  if (poi.address && poi.address.toLowerCase().includes(searchLower)) return true;

  // オプショナルなプロパティは最後にチェック
  return typeof poi.genre === 'string' && poi.genre.toLowerCase().includes(searchLower);
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

      // 最適化: 空の検索や全選択の場合、処理を早期に返す
      const isEmptySearch = searchLower === '';
      const isAllStatusFilter = statusFilter === 'all';

      // 実際に true の値を持つフィルターがあるかチェック（メソッドを最適化）
      const hasActiveCategoryFilter = Array.from(categoryFilters.values()).some(Boolean);
      const hasActiveDistrictFilter = Array.from(districtFilters.values()).some(Boolean);

      // すべてのフィルタが非アクティブの場合は早期リターン
      if (
        isEmptySearch &&
        isAllStatusFilter &&
        !hasActiveCategoryFilter &&
        !hasActiveDistrictFilter
      ) {
        return pois;
      }

      // フィルタリング実行前にログ記録
      logger.debug('POIフィルタリング開始', {
        component: COMPONENT_NAME,
        action: 'filter_pois',
        poiCount: pois.length,
        statusFilter,
        searchTextLength: searchText.length,
        hasFilters: { category: hasActiveCategoryFilter, district: hasActiveDistrictFilter },
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
        if (!isAllStatusFilter) {
          const isOpen = !poi.isClosed; // isClosed フラグを使用
          if (statusFilter === 'open' && !isOpen) return false;
          if (statusFilter === 'closed' && isOpen) return false;
        }

        // テキスト検索フィルター（空検索時はスキップ）
        if (!isEmptySearch && !matchesSearchText(poi, searchLower)) {
          return false;
        }

        return true;
      });
    },
    LogLevel.DEBUG
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
  // filterMapを更新する共通関数（重複コード削減）
  const updateFilterMap = useCallback(
    <T extends string>(
      currentMap: Map<string, boolean>,
      newItems: T[]
    ): [Map<string, boolean>, boolean] => {
      const next = new Map(currentMap);
      let changed = false;

      // 新しいアイテムを追加
      for (const item of newItems) {
        if (!next.has(item)) {
          next.set(item, true);
          changed = true;
        }
      }

      // 存在しなくなったアイテムを削除
      for (const key of Array.from(next.keys())) {
        if (!newItems.includes(key as T)) {
          next.delete(key);
          changed = true;
        }
      }

      return [changed ? next : currentMap, changed];
    },
    []
  );

  // Initialize filters when categories/districts change
  useEffect(() => {
    // カテゴリフィルターの更新
    setCategoryFilters(prev => {
      const [newMap] = updateFilterMap(prev, categories);
      return newMap;
    });

    // 地区フィルターの更新
    setDistrictFilters(prev => {
      const [newMap] = updateFilterMap(prev, districts);
      return newMap;
    });
  }, [categories, districts, updateFilterMap]);

  const { createToggleHandler, createChangeHandler } = useFilterSelection();
  const handleCategoryChange = createChangeHandler(setCategoryFilters);
  const handleDistrictChange = createChangeHandler(setDistrictFilters);
  const handleToggleAllCategories = createToggleHandler(categories, setCategoryFilters);
  const handleToggleAllDistricts = createToggleHandler(districts, setDistrictFilters);

  const filteredPOIs = useMemo(() => {
    return filterPOIs(pois, categoryFilters, districtFilters, statusFilter, searchText);
  }, [pois, categoryFilters, districtFilters, statusFilter, searchText]);
  /**
   * 最適化されたデバウンスフック
   */
  const useDebounce = <T>(value: T, delay: number, callback: (value: T) => void): void => {
    useEffect(() => {
      const handler = setTimeout(() => {
        callback(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay, callback]);
  };

  // デバウンスされたコールバック
  const debouncedFilterChange = useCallback(
    (pois: PointOfInterest[]) => {
      onFilterChange(pois);
    },
    [onFilterChange]
  );

  // 最適化されたデバウンス処理（複雑なRef管理を避ける）
  useDebounce(filteredPOIs, 50, debouncedFilterChange);
  const handleResetFilters = useCallback(() => {
    // Mapオブジェクト全体を新しく作り直す（より効率的なリセット方法）
    const resetCategoryFilters = new Map(categories.map(cat => [cat, true]));
    const resetDistrictFilters = new Map(districts.map(dist => [dist, true]));

    setCategoryFilters(resetCategoryFilters);
    setDistrictFilters(resetDistrictFilters);
    setStatusFilter('all');
    setSearchText('');

    logger.info('フィルターリセット完了', {
      component: COMPONENT_NAME,
      action: 'reset_filters_complete',
      categoryCount: categories.length,
      districtCount: districts.length,
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
