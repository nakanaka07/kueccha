import '@/global.css';

// React フック
import { useCallback, useState, useMemo } from 'react';

// プロジェクト固有のインポート
import {
  CheckboxGroup,
  FilterPanelHeader,
  SearchInput,
  StatusFilterInput,
} from './FilterComponents';

import { useFilterLogic } from '@/hooks/useFilterLogic';
import type { PointOfInterest } from '@/types/poi';
import { ENV } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

// コンポーネント名を定数化して再利用（ロガーガイドライン準拠）
const COMPONENT_NAME = 'FilterPanel';

interface FilterPanelProps {
  pois: PointOfInterest[];
  onFilterChange: (filteredPois: PointOfInterest[]) => void;
  className?: string;
}

/**
 * フィルターパネルの内容部分を描画するコンポーネント
 */
const FilterPanelContent: React.FC<{
  filterLogic: ReturnType<typeof useFilterLogic>;
  filterGroups: Array<{
    id: string;
    groupLabel: string;
    itemLabelPrefix: string;
    items: string[];
    selectedItems: Record<string, boolean>;
    onChange: (item: string, isChecked: boolean) => void;
    onToggleAll: (selectAll: boolean) => void;
  }>;
  handleResetFilters: () => void;
}> = ({ filterLogic, filterGroups, handleResetFilters }) => {
  return (
    <div
      id='filter-content'
      className='filter-panel-content'
      role='group'
      aria-labelledby='filter-heading'
    >
      {/* テキスト検索フィルター */}
      <SearchInput value={filterLogic.searchText} onChange={filterLogic.setSearchText} />

      {/* 営業状態フィルター */}
      <StatusFilterInput value={filterLogic.statusFilter} onChange={filterLogic.setStatusFilter} />

      {/* フィルターグループの宣言的レンダリング */}
      {filterGroups.map(group => (
        <CheckboxGroup
          key={group.id}
          items={group.items}
          selectedItems={group.selectedItems}
          onChange={group.onChange}
          onSelectAll={() => group.onToggleAll(true)}
          onDeselectAll={() => group.onToggleAll(false)}
          groupLabel={group.groupLabel}
          itemLabelPrefix={group.itemLabelPrefix}
          id={`${group.id}-filter-group`}
          aria-labelledby={`${group.id}-filter-heading`}
        />
      ))}

      {/* リセットボタンセクション */}
      <div className='filter-actions'>
        <button
          type='button'
          onClick={handleResetFilters}
          className='reset-button'
          aria-label='すべてのフィルターをリセット'
        >
          フィルターをリセット
        </button>
      </div>
    </div>
  );
};

/**
 * POIデータのフィルタリングを行うパネルコンポーネント
 *
 * カテゴリ、地区、営業状態、テキスト検索によるフィルタリングを提供します。
 * パネルは展開/折りたたみ可能で、ユーザーは必要に応じて詳細なフィルターにアクセスできます。
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ pois, onFilterChange, className = '' }) => {
  // 条件付きロギング - 本番環境では出力しない（ロガーガイドライン準拠）
  if (ENV.env.isDev || ENV.features.verboseLogging) {
    logger.debug('FilterPanelレンダリング', {
      component: COMPONENT_NAME,
      poisCount: pois.length,
      // 構造化ログに追加コンテキスト
      action: 'render',
      timestamp: new Date().toISOString(),
    });
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const filterLogic = useFilterLogic(pois, onFilterChange);

  // トグル操作の最適化
  const togglePanel = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;

      // 環境変数に基づく条件付きロギング
      if (ENV.env.isDev || ENV.features.verboseLogging) {
        logger.debug('フィルターパネル状態変更', {
          component: COMPONENT_NAME,
          expanded: newState,
          action: 'toggle_panel',
        });
      }

      return newState;
    });
  }, []);

  // フィルターグループの定義を配列として抽象化
  const filterGroups = useMemo(
    () => [
      {
        id: 'category',
        groupLabel: 'カテゴリー',
        itemLabelPrefix: 'カテゴリーでフィルター',
        items: filterLogic.categories,
        selectedItems: filterLogic.categoryFilters,
        onChange: filterLogic.handleCategoryChange,
        onToggleAll: filterLogic.handleToggleAllCategories,
      },
      {
        id: 'district',
        groupLabel: '地区',
        itemLabelPrefix: 'でフィルター',
        items: filterLogic.districts,
        selectedItems: filterLogic.districtFilters,
        onChange: filterLogic.handleDistrictChange,
        onToggleAll: filterLogic.handleToggleAllDistricts,
      },
    ],
    [
      filterLogic.categories,
      filterLogic.categoryFilters,
      filterLogic.districts,
      filterLogic.districtFilters,
      filterLogic.handleCategoryChange,
      filterLogic.handleDistrictChange,
      filterLogic.handleToggleAllCategories,
      filterLogic.handleToggleAllDistricts,
    ]
  );

  // リセット処理のパフォーマンス計測（結果を活用）
  const handleResetFilters = useCallback(() => {
    // リセット処理の実行と時間計測（コード最適化ガイドライン準拠）
    logger.measureTime(
      'フィルターリセット処理',
      () => {
        filterLogic.handleResetFilters();
      },
      ENV.env.isProd ? LogLevel.WARN : LogLevel.INFO, // 本番環境ではより高いログレベル
      {
        component: COMPONENT_NAME,
        action: 'reset_filters',
        filterCount:
          Object.keys(filterLogic.categoryFilters).length +
          Object.keys(filterLogic.districtFilters).length,
      }
    );
  }, [filterLogic]);

  return (
    <div
      className={`filter-panel ${className} ${isExpanded ? 'expanded' : 'collapsed'}`}
      role='region'
      aria-label='フィルターパネル'
    >
      <FilterPanelHeader isExpanded={isExpanded} togglePanel={togglePanel} />
      {isExpanded && (
        <FilterPanelContent
          filterLogic={filterLogic}
          filterGroups={filterGroups}
          handleResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
};

export default FilterPanel;
