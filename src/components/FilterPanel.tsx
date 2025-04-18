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
import type { PointOfInterest } from '@/types/poi-types'; // Corrected import path
import { logger } from '@/utils/logger'; // Removed LogLevel import as it's not directly used here

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
    selectedItems: Map<string, boolean>; // Changed from Record<string, boolean>
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
          selectedItems={group.selectedItems} // Now expects Map
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
  logger.debug('FilterPanelレンダリング', {
    component: COMPONENT_NAME,
    poisCount: pois.length,
    action: 'render',
    timestamp: new Date().toISOString(),
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const filterLogic = useFilterLogic(pois, onFilterChange);

  // トグル操作の最適化
  const togglePanel = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;

      logger.debug('フィルターパネル状態変更', {
        component: COMPONENT_NAME,
        expanded: newState,
        action: 'toggle_panel',
      });

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
        selectedItems: filterLogic.categoryFilters, // This is Map<string, boolean>
        onChange: filterLogic.handleCategoryChange,
        onToggleAll: filterLogic.handleToggleAllCategories,
      },
      {
        id: 'district',
        groupLabel: '地区',
        itemLabelPrefix: 'でフィルター',
        items: filterLogic.districts,
        selectedItems: filterLogic.districtFilters, // This is Map<string, boolean>
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

  // リセット処理の簡素化 (KISS)
  const handleResetFilters = useCallback(() => {
    logger.info('フィルターリセット実行', {
      // Simplified logging
      component: COMPONENT_NAME,
      action: 'reset_filters',
    });
    filterLogic.handleResetFilters();
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
          filterGroups={filterGroups} // Pass filterGroups with Map type
          handleResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
};

export default FilterPanel;
