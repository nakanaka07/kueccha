import React, { useCallback } from 'react';

interface CheckboxGroupProps {
  items: string[];
  selectedItems: Record<string, boolean>;
  onChange: (item: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  groupLabel: string;
  itemLabelPrefix: string;
  id?: string; // オプションのID属性
  'aria-labelledby'?: string; // アクセシビリティのためのaria-labelledby属性
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = React.memo(
  ({
    items,
    selectedItems,
    onChange,
    onSelectAll,
    onDeselectAll,
    groupLabel,
    itemLabelPrefix,
    id,
    'aria-labelledby': ariaLabelledby,
  }) => {
    const handleChange = useCallback(
      (item: string, checked: boolean) => {
        onChange(item, checked);
      },
      [onChange]
    );

    return (
      <fieldset className='filter-section' id={id}>
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
        <div
          className='checkbox-grid'
          role='group'
          aria-label={`${groupLabel}フィルター`}
          aria-labelledby={ariaLabelledby}
        >
          {items.map(item => (
            <label key={item} className='checkbox-label'>
              <input
                type='checkbox'
                checked={selectedItems[item] || false}
                onChange={e => handleChange(item, e.target.checked)}
                aria-label={`${item}${itemLabelPrefix}`}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';

interface FilterPanelHeaderProps {
  isExpanded: boolean;
  togglePanel: () => void;
}

export const FilterPanelHeader: React.FC<FilterPanelHeaderProps> = React.memo(
  ({ isExpanded, togglePanel }) => {
    return (
      <div className='filter-panel-header'>
        <h2 id='filter-heading'>絞り込み検索</h2>
        <button
          type='button'
          className='filter-toggle-button'
          onClick={togglePanel}
          aria-expanded={isExpanded}
          aria-controls='filter-content'
          aria-labelledby='filter-heading'
        >
          {isExpanded ? '絞り込みを閉じる' : '絞り込みを開く'}
        </button>
      </div>
    );
  }
);

FilterPanelHeader.displayName = 'FilterPanelHeader';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = React.memo(({ value, onChange }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className='filter-section'>
      <h3 id='keyword-search-label'>キーワード検索</h3>
      <div className='search-input-container'>
        <input
          type='text'
          value={value}
          onChange={handleChange}
          placeholder='店名・住所・ジャンルで検索'
          aria-labelledby='keyword-search-label'
          className='search-input'
        />
        {value && (
          <button
            type='button'
            className='clear-search-button'
            onClick={handleClear}
            aria-label='検索をクリア'
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

interface StatusFilterProps {
  value: 'all' | 'open' | 'closed';
  onChange: (status: 'all' | 'open' | 'closed') => void;
}

export const StatusFilterInput: React.FC<StatusFilterProps> = React.memo(({ value, onChange }) => {
  const handleChange = useCallback(
    (newValue: 'all' | 'open' | 'closed') => {
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <fieldset className='filter-section'>
      <legend>営業状態</legend>
      <div className='status-options'>
        <label className='radio-label'>
          <input
            type='radio'
            name='status'
            checked={value === 'all'}
            onChange={() => handleChange('all')}
            aria-label='すべての施設を表示'
          />
          <span>すべて</span>
        </label>
        <label className='radio-label'>
          <input
            type='radio'
            name='status'
            checked={value === 'open'}
            onChange={() => handleChange('open')}
            aria-label='営業中の施設のみ表示'
          />
          <span>営業中</span>
        </label>
        <label className='radio-label'>
          <input
            type='radio'
            name='status'
            checked={value === 'closed'}
            onChange={() => handleChange('closed')}
            aria-label='閉店した施設のみ表示'
          />
          <span>閉店</span>
        </label>
      </div>
    </fieldset>
  );
});

StatusFilterInput.displayName = 'StatusFilterInput';
