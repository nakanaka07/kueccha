import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';
import { ENV } from '@/utils/env';

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
 * テキスト検索条件に基づいてPOIをフィルタリングする関数
 * 頻繁に呼び出されるのでインライン化は避けて再利用
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
 * 共通の選択状態変更ロジックを提供するカスタムフック
 * useFilterLogic外に分離してメモリ効率を向上
 */
const useFilterSelection = () => {
  // 全選択/全解除ハンドラの生成関数
  const createToggleHandler = useCallback(
    (
      items: string[],
      setFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    ) => {
      return (select: boolean) => {
        logger.debug('フィルター全選択/解除', {
          component: COMPONENT_NAME,
          action: 'toggle_all',
          itemCount: items.length,
          select,
        });

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
        // 高頻度発生操作のため、環境に応じたデバッグログ出力
        if (ENV.env.debug || ENV.features.verboseLogging) {
          logger.debug('フィルター項目変更', {
            component: COMPONENT_NAME,
            action: 'change_item',
            item,
            checked,
          });
        }

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
 * ユニークカテゴリと地区を抽出する関数
 * useMemoで呼び出す前提で最適化
 */
const extractUniqueValues = (pois: PointOfInterest[]) => {
  // パフォーマンス最適化: Set利用の前に配列長チェック
  if (!pois.length) return { categories: [], districts: [] };

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
};

/**
 * POIをフィルタリングする関数
 * 重要な処理なのでuseMemoでメモ化して再利用
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
      // サンプリングされた測定を行いたい場合に備えてコンテキストを準備
      const logContext = {
        component: COMPONENT_NAME,
        action: 'filter_pois',
        totalPOIs: pois.length,
        searchTextLength: searchText.length,
        statusFilter,
        categoryFiltersCount: Object.values(categoryFilters).filter(Boolean).length,
        districtFiltersCount: Object.values(districtFilters).filter(Boolean).length,
      };

      // 最適化: フィルタリングが不要なケースを早期に検出
      const noCategories = !Object.values(categoryFilters).some(Boolean);
      const noDistricts = !Object.values(districtFilters).some(Boolean);

      if (noCategories && noDistricts && statusFilter === 'all' && !searchText) {
        logger.debug('フィルタリング条件なし、全POI返却', logContext);
        return pois;
      }

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
    {
      component: COMPONENT_NAME,
      action: 'filter_pois',
      totalPOIs: pois.length,
    },
    // 環境変数に応じてログ閾値を調整
    ENV.env.isProd ? 100 : 50
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
  logger.debug('useFilterLogic が呼び出されました', {
    component: COMPONENT_NAME,
    action: 'hook_init',
    poisCount: pois.length,
  });

  // 初期化済みフラグの参照を保持（初回のみ全選択を行うため）
  const isInitialized = useRef(false);

  // フィルター状態
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({});
  const [districtFilters, setDistrictFilters] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');

  // POIデータからユニークなカテゴリーと地区を抽出（メモ化）
  const { categories, districts } = useMemo(() => extractUniqueValues(pois), [pois]);

  // フィルター選択状態管理ロジック
  const { createToggleHandler, createChangeHandler } = useFilterSelection();

  // カテゴリーとディストリクト用のハンドラ（メモ化）
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

  // 初期化時のみすべてのカテゴリと地区を選択状態にする（参照を活用）
  useEffect(() => {
    if (!isInitialized.current && categories.length > 0 && districts.length > 0) {
      logger.info('フィルターの初期化', {
        component: COMPONENT_NAME,
        action: 'initialize_filters',
        categoriesCount: categories.length,
        districtsCount: districts.length,
      });

      handleToggleAllCategories(true);
      handleToggleAllDistricts(true);
      isInitialized.current = true;
    }
  }, [categories, districts, handleToggleAllCategories, handleToggleAllDistricts]);

  // フィルタリング結果をメモ化（依存関係の最適化）
  const filteredPois = useMemo(
    () => filterPOIs(pois, categoryFilters, districtFilters, statusFilter, searchText),
    [pois, categoryFilters, districtFilters, statusFilter, searchText]
  );

  // フィルタ変更時の処理
  useEffect(() => {
    logger.info('フィルター適用結果', {
      component: COMPONENT_NAME,
      action: 'apply_filters',
      totalPOIs: pois.length,
      filteredCount: filteredPois.length,
      categoryFiltersCount: Object.values(categoryFilters).filter(Boolean).length,
      districtFiltersCount: Object.values(districtFilters).filter(Boolean).length,
      statusFilter,
      hasSearchText: !!searchText,
    });

    onFilterChange(filteredPois);
  }, [
    filteredPois,
    pois.length,
    categoryFilters,
    districtFilters,
    statusFilter,
    searchText,
    onFilterChange,
  ]);

  // フィルタをリセットするハンドラ（メモ化）
  const handleResetFilters = useCallback(() => {
    logger.info('フィルターをリセット', {
      component: COMPONENT_NAME,
      action: 'reset_filters',
    });

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
