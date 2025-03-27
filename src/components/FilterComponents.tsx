import React from 'react';

interface CheckboxGroupProps {
  items: string[];
  selectedItems: Record<string, boolean>;
  onChange: (item: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  groupLabel: string;
  itemLabelPrefix: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  items,
  selectedItems,
  onChange,
  onSelectAll,
  onDeselectAll,
  groupLabel,
  itemLabelPrefix,
}) => {
  return (
    <fieldset className='filter-section'>
      <legend>{groupLabel}</legend>
      <div className='section-header'>
        <div className='toggle-buttons'>
          <button
            type='button'
            onClick={onSelectAll}
            className='toggle-all-button'
            aria-label={`すべての${groupLabel}を選択`}
          >
            すべて選択
          </button>
          <button
            type='button'
            onClick={onDeselectAll}
            className='toggle-all-button'
            aria-label={`すべての${groupLabel}を解除`}
          >
            すべて解除
          </button>
        </div>
      </div>
      <div className='checkbox-grid' role='group' aria-label={`${groupLabel}フィルター`}>
        {items.map(item => (
          <label key={item} className='checkbox-label'>
            <input
              type='checkbox'
              checked={selectedItems[item] || false}
              onChange={e => onChange(item, e.target.checked)}
              aria-label={`${item}${itemLabelPrefix}`}
            />
            {item}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

interface FilterPanelHeaderProps {
  isExpanded: boolean;
  togglePanel: () => void;
}

export const FilterPanelHeader: React.FC<FilterPanelHeaderProps> = ({
  isExpanded,
  togglePanel,
}) => {
  return (
    <div className='filter-panel-header'>
      <h2 id='filter-heading'>絞り込み検索</h2>
      <button
        type='button'
        className='filter-toggle-button'
        onClick={togglePanel}
        aria-expanded={isExpanded}
        aria-controls='filter-content'
      >
        {isExpanded ? '絞り込みを閉じる' : '絞り込みを開く'}
      </button>
    </div>
  );
};

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => {
  return (
    <div className='filter-section'>
      <h3 id='keyword-search-label'>キーワード検索</h3>
      <div className='search-input-container'>
        <input
          type='text'
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder='店名・住所・ジャンルで検索'
          aria-labelledby='keyword-search-label'
          className='search-input'
        />
        {value && (
          <button
            type='button'
            className='clear-search-button'
            onClick={() => onChange('')}
            aria-label='検索をクリア'
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

interface StatusFilterProps {
  value: 'all' | 'open' | 'closed';
  onChange: (status: 'all' | 'open' | 'closed') => void;
}

export const StatusFilterInput: React.FC<StatusFilterProps> = ({ value, onChange }) => {
  return (
    <fieldset className='filter-section'>
      <legend>営業状態</legend>
      <div className='status-options'>
        <label className='radio-label'>
          <input
            type='radio'
            name='status'
            checked={value === 'all'}
            onChange={() => onChange('all')}
            aria-label='すべての施設を表示'
          />
          すべて
        </label>
        <label className='radio-label'>
          <input
            type='radio'
            name='status'
            checked={value === 'open'}
            onChange={() => onChange('open')}
            aria-label='営業中の施設のみ表示'
          />
          営業中
        </label>
        <label className='radio-label'>
          <input
            type='radio'
            name='status'
            checked={value === 'closed'}
            onChange={() => onChange('closed')}
            aria-label='閉店した施設のみ表示'
          />
          閉店
        </label>
      </div>
    </fieldset>
  );
};
