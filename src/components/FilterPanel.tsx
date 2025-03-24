import { useCallback, useEffect, useMemo, useState } from 'react';
import { PointOfInterest } from '@/types/poi';
import '@/global.css';

interface FilterPanelProps {
  pois: PointOfInterest[];
  onFilterChange: (filteredPois: PointOfInterest[]) => void;
  className?: string;
}

/**
 * POIデータのフィルタリングを行うパネルコンポーネント
 * 
 * カテゴリ、地区、営業状態、テキスト検索によるフィルタリングを提供します
 */
const FilterPanel: React.FC<FilterPanelProps> = ({ 
  pois, 
  onFilterChange, 
  className = '' 
}) => {
  // フィルター状態
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({});
  const [districtFilters, setDistrictFilters] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [searchText, setSearchText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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
      districts: Array.from(districtsSet).sort()
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
        const nameMatch = poi.name?.toLowerCase().includes(searchLower);
        const addressMatch = poi.address?.toLowerCase().includes(searchLower);
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
      [category]: checked
    }));
  }, []);

  // 地区フィルタの変更ハンドラ
  const handleDistrictChange = useCallback((district: string, checked: boolean) => {
    setDistrictFilters(prev => ({
      ...prev,
      [district]: checked
    }));
  }, []);

  // すべてのカテゴリを選択/解除するハンドラ
  const handleToggleAllCategories = useCallback((select: boolean) => {
    const updated: Record<string, boolean> = {};
    categories.forEach(category => {
      updated[category] = select;
    });
    setCategoryFilters(updated);
  }, [categories]);

  // すべての地区を選択/解除するハンドラ
  const handleToggleAllDistricts = useCallback((select: boolean) => {
    const updated: Record<string, boolean> = {};
    districts.forEach(district => {
      updated[district] = select;
    });
    setDistrictFilters(updated);
  }, [districts]);

  // フィルタをリセットするハンドラ
  const handleResetFilters = useCallback(() => {
    handleToggleAllCategories(true);
    handleToggleAllDistricts(true);
    setStatusFilter('all');
    setSearchText('');
  }, [handleToggleAllCategories, handleToggleAllDistricts]);

  // パネルの開閉を切り替えるハンドラ
  const togglePanel = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className={`filter-panel ${className} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="filter-panel-header">
        <h2 id="filter-heading">絞り込み検索</h2>
        <button 
          type="button"
          className="filter-toggle-button"
          onClick={togglePanel}
          {...{ 'aria-expanded': isExpanded ? 'true' : 'false' }}
          aria-controls="filter-content"
        >
          {isExpanded ? '絞り込みを閉じる' : '絞り込みを開く'}
        </button>
      </div>

      {isExpanded && (
        <div id="filter-content" className="filter-panel-content">
          {/* テキスト検索 */}
          <div className="filter-section">
            <h3 id="keyword-search-label">キーワード検索</h3>
            <div className="search-input-container">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="店名・住所・ジャンルで検索"
                aria-labelledby="keyword-search-label"
                className="search-input"
              />
              {searchText && (
                <button 
                  type="button"
                  className="clear-search-button"
                  onClick={() => setSearchText('')}
                  aria-label="検索をクリア"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 営業状態フィルタ */}
          <fieldset className="filter-section">
            <legend>営業状態</legend>
            <div className="status-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  checked={statusFilter === 'all'}
                  onChange={() => setStatusFilter('all')}
                  aria-label="すべての施設を表示"
                />
                すべて
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  checked={statusFilter === 'open'}
                  onChange={() => setStatusFilter('open')}
                  aria-label="営業中の施設のみ表示"
                />
                営業中
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  checked={statusFilter === 'closed'}
                  onChange={() => setStatusFilter('closed')}
                  aria-label="閉店した施設のみ表示"
                />
                閉店
              </label>
            </div>
          </fieldset>

          {/* カテゴリフィルタ */}
          <fieldset className="filter-section">
            <legend>カテゴリー</legend>
            <div className="section-header">
              <div className="toggle-buttons">
                <button 
                  type="button"
                  onClick={() => handleToggleAllCategories(true)}
                  className="toggle-all-button"
                  aria-label="すべてのカテゴリーを選択"
                >
                  すべて選択
                </button>
                <button 
                  type="button"
                  onClick={() => handleToggleAllCategories(false)}
                  className="toggle-all-button"
                  aria-label="すべてのカテゴリーを解除"
                >
                  すべて解除
                </button>
              </div>
            </div>
            <div className="checkbox-grid" role="group" aria-label="カテゴリーフィルター">
              {categories.map(category => (
                <label key={category} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={categoryFilters[category] || false}
                    onChange={(e) => handleCategoryChange(category, e.target.checked)}
                    aria-label={`${category}カテゴリーでフィルター`}
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>

          {/* 地区フィルタ */}
          <fieldset className="filter-section">
            <legend>地区</legend>
            <div className="section-header">
              <div className="toggle-buttons">
                <button 
                  type="button"
                  onClick={() => handleToggleAllDistricts(true)}
                  className="toggle-all-button"
                  aria-label="すべての地区を選択"
                >
                  すべて選択
                </button>
                <button 
                  type="button"
                  onClick={() => handleToggleAllDistricts(false)}
                  className="toggle-all-button"
                  aria-label="すべての地区を解除"
                >
                  すべて解除
                </button>
              </div>
            </div>
            <div className="checkbox-grid" role="group" aria-label="地区フィルター">
              {districts.map(district => (
                <label key={district} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={districtFilters[district] || false}
                    onChange={(e) => handleDistrictChange(district, e.target.checked)}
                    aria-label={`${district}でフィルター`}
                  />
                  {district}
                </label>
              ))}
            </div>
          </fieldset>

          {/* リセットボタン */}
          <div className="filter-actions">
            <button 
              type="button"
              onClick={handleResetFilters}
              className="reset-button"
              aria-label="すべてのフィルターをリセット"
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