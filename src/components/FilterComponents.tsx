import React, { useCallback } from 'react';
import { logger, LogLevel } from '@/utils/logger';
import { ENV } from '@/utils/env';

// コンポーネント名を定数化して再利用（ロガーガイドライン準拠）
const COMPONENT_NAMES = {
  CHECKBOX_GROUP: 'CheckboxGroup',
  FILTER_PANEL_HEADER: 'FilterPanelHeader',
  SEARCH_INPUT: 'SearchInput',
  STATUS_FILTER: 'StatusFilterInput',
};

// サンプリングレート（高頻度のログを間引く設定）
const LOG_SAMPLING_RATE = ENV.env.isProd ? 20 : 5; // 本番では20回に1回、開発では5回に1回ログ出力
let logCounter = 0;

// 条件付きロギング用ヘルパー関数
const logIfEnabled = (message: string, level: LogLevel, context: Record<string, any>) => {
  // 開発環境または詳細ログが有効な場合のみログ出力
  if (ENV.env.isDev || ENV.features.verboseLogging) {
    // 高頻度操作の場合はサンプリング
    if (level === LogLevel.DEBUG) {
      logCounter++;
      if (logCounter % LOG_SAMPLING_RATE !== 0) return;
    }

    // logger.log の代わりにログレベルに応じたメソッドを使用
    switch (level) {
      case LogLevel.ERROR:
        logger.error(message, context);
        break;
      case LogLevel.WARN:
        logger.warn(message, context);
        break;
      case LogLevel.INFO:
        logger.info(message, context);
        break;
      case LogLevel.DEBUG:
        logger.debug(message, context);
        break;
    }
  }
};

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
        // パフォーマンス測定（高頻度操作のため条件付きロギング）
        logger.measureTime(
          `${groupLabel}フィルター変更`,
          () => {
            onChange(item, checked);
          },
          ENV.env.isProd ? LogLevel.WARN : LogLevel.DEBUG,
          {
            component: COMPONENT_NAMES.CHECKBOX_GROUP,
            action: 'change_filter',
            item,
            checked,
          }
        );
      },
      [onChange, groupLabel]
    );

    const handleSelectAll = useCallback(() => {
      logIfEnabled(`${groupLabel}フィルター全選択`, LogLevel.INFO, {
        component: COMPONENT_NAMES.CHECKBOX_GROUP,
        action: 'select_all',
        groupLabel,
      });
      onSelectAll();
    }, [onSelectAll, groupLabel]);

    const handleDeselectAll = useCallback(() => {
      logIfEnabled(`${groupLabel}フィルター全解除`, LogLevel.INFO, {
        component: COMPONENT_NAMES.CHECKBOX_GROUP,
        action: 'deselect_all',
        groupLabel,
      });
      onDeselectAll();
    }, [onDeselectAll, groupLabel]);

    return (
      <fieldset className='filter-section' id={id}>
        <legend>{groupLabel}</legend>
        <div className='section-header'>
          <div className='toggle-buttons'>
            <button
              type='button'
              onClick={handleSelectAll}
              className='toggle-all-button'
              aria-label={`すべての${groupLabel}を選択`}
            >
              すべて選択
            </button>
            <button
              type='button'
              onClick={handleDeselectAll}
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
                checked={selectedItems[item] ?? false}
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

CheckboxGroup.displayName = COMPONENT_NAMES.CHECKBOX_GROUP;

interface FilterPanelHeaderProps {
  isExpanded: boolean;
  togglePanel: () => void;
}

export const FilterPanelHeader: React.FC<FilterPanelHeaderProps> = React.memo(
  ({ isExpanded, togglePanel }) => {
    const handleToggle = useCallback(() => {
      // 環境に応じたロギングレベル設定
      logIfEnabled(`フィルターパネル ${isExpanded ? '折りたたみ' : '展開'}`, LogLevel.DEBUG, {
        component: COMPONENT_NAMES.FILTER_PANEL_HEADER,
        action: 'toggle_panel',
        isExpanded: !isExpanded,
      });
      togglePanel();
    }, [isExpanded, togglePanel]);

    return (
      <div className='filter-panel-header'>
        <h2 id='filter-heading'>絞り込み検索</h2>
        <button
          type='button'
          className='filter-toggle-button'
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls='filter-content'
          aria-labelledby='filter-heading'
          // GPU高速化のためにwillChangeを指定（コード最適化ガイドライン準拠）
          style={{ willChange: isExpanded ? 'transform' : 'auto' }}
        >
          {isExpanded ? '絞り込みを閉じる' : '絞り込みを開く'}
        </button>
      </div>
    );
  }
);

FilterPanelHeader.displayName = COMPONENT_NAMES.FILTER_PANEL_HEADER;

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = React.memo(({ value, onChange }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // 検索キーワード入力は高頻度発生操作のため条件付きロギング
      if (ENV.env.isDev && newValue.length % 3 === 0) {
        // 文字数が3の倍数のときだけログを出力
        logger.debug('検索キーワード入力', {
          component: COMPONENT_NAMES.SEARCH_INPUT,
          action: 'input_search',
          valueLength: newValue.length,
        });
      }

      onChange(newValue);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    logIfEnabled('検索キーワードクリア', LogLevel.INFO, {
      component: COMPONENT_NAMES.SEARCH_INPUT,
      action: 'clear_search',
      previousLength: value.length,
    });
    onChange('');
  }, [onChange, value.length]);

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

SearchInput.displayName = COMPONENT_NAMES.SEARCH_INPUT;

interface StatusFilterProps {
  value: 'all' | 'open' | 'closed';
  onChange: (status: 'all' | 'open' | 'closed') => void;
}

export const StatusFilterInput: React.FC<StatusFilterProps> = React.memo(({ value, onChange }) => {
  const handleChange = useCallback(
    (newValue: 'all' | 'open' | 'closed') => {
      logger.measureTime(
        '営業状態フィルター変更',
        () => {
          onChange(newValue);
        },
        ENV.env.isProd ? LogLevel.INFO : LogLevel.DEBUG,
        {
          component: COMPONENT_NAMES.STATUS_FILTER,
          action: 'change_status',
          previousValue: value,
          newValue,
        }
      );
    },
    [onChange, value]
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

StatusFilterInput.displayName = COMPONENT_NAMES.STATUS_FILTER;
