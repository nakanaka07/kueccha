import '@/global.css';

// React フック
import { useCallback, useState, useMemo } from 'react';

// プロジェクト固有のインポート
import { useFilterLogic } from '@/hooks/useFilterLogic';
import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

import {
  CheckboxGroup,
  FilterPanelHeader,
  SearchInput,
  StatusFilterInput,
} from './FilterComponents';

interface FilterPanelProps {
  pois: PointOfInterest[];
  onFilterChange: (filteredPois: PointOfInterest[]) => void;
  className?: string;
}

/**
 * POIデータのフィルタリングを行うパネルコンポーネント
 *
 * カテゴリ、地区、営業状態、テキスト検索によるフィルタリングを提供します。
 * パネルは展開/折りたたみ可能で、ユーザーは必要に応じて詳細なフィルターにアクセスできます。
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ pois, onFilterChange, className = '' }) => {
  logger.debug('FilterPanelレンダリング', { poisCount: pois.length });
  const [isExpanded, setIsExpanded] = useState(false);
  const filterLogic = useFilterLogic(pois, onFilterChange);

  // トグル操作の最適化
  const togglePanel = useCallback(() => {
    setIsExpanded(prev => {
      const newState = !prev;
      logger.debug('フィルターパネル状態変更', { expanded: newState });
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

  // リセット処理のパフォーマンス計測
  const handleResetFilters = useCallback(() => {
    logger.measureTime('フィルターリセット処理', () => {
      filterLogic.handleResetFilters();
    });
  }, [filterLogic]);

  return (
    <div
      className={`filter-panel ${className} ${isExpanded ? 'expanded' : 'collapsed'}`}
      role='region'
      aria-label='フィルターパネル'
    >
      <FilterPanelHeader isExpanded={isExpanded} togglePanel={togglePanel} />

      {isExpanded && (
        <div
          id='filter-content'
          className='filter-panel-content'
          role='group'
          aria-labelledby='filter-heading'
        >
          {/* テキスト検索フィルター */}
          <SearchInput value={filterLogic.searchText} onChange={filterLogic.setSearchText} />

          {/* 営業状態フィルター */}
          <StatusFilterInput
            value={filterLogic.statusFilter}
            onChange={filterLogic.setStatusFilter}
          />

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
      )}
    </div>
  );
};

export default FilterPanel;
