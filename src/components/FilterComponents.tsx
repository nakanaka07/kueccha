import React, { useCallback } from 'react'; // React と useCallback をインポート

import { getEnvBool } from '@/env/core';
import { logger, LogLevel, LogContext } from '@/utils/logger'; // LogContext型を追加でインポート

// 環境設定を一箇所に集約（KISS原則に基づくシンプルな設定）
const ENV = {
  isDevelopment: getEnvBool('VITE_ENV_DEVELOPMENT', true),
  isProduction: getEnvBool('VITE_ENV_PRODUCTION', false),
  verboseLogging: getEnvBool('VITE_FEATURE_VERBOSE_LOGGING', false),
  logSamplingRate: getEnvBool('VITE_ENV_PRODUCTION', false) ? 20 : 5,
};

// コンポーネント名を定数化して再利用
const COMPONENT_NAMES = {
  CHECKBOX_GROUP: 'CheckboxGroup',
  FILTER_PANEL_HEADER: 'FilterPanelHeader',
  SEARCH_INPUT: 'SearchInput',
  STATUS_FILTER: 'StatusFilterInput',
};

// 型安全性の向上
type StatusValue = 'all' | 'open' | 'closed';

// サンプリングレートと状態管理（YAGNI原則に基づき、必要最小限の実装）
let logCounter = 0;

// 簡素化されたロギング関数
const logIfNeeded = (message: string, level: LogLevel, context: LogContext): void => {
  // 本番環境ではデバッグログを制限
  if (level === LogLevel.DEBUG && ENV.isProduction && !ENV.verboseLogging) {
    return;
  }

  // 高頻度のDEBUGログはサンプリング
  if (level === LogLevel.DEBUG) {
    logCounter++;
    if (logCounter % ENV.logSamplingRate !== 0) return;
  }

  // 適切なログレベルメソッドを安全に呼び出し (switch文を使用)
  switch (level) {
    case LogLevel.DEBUG:
      logger.debug(message, context);
      break;
    case LogLevel.INFO:
      logger.info(message, context);
      break;
    case LogLevel.WARN:
      logger.warn(message, context);
      break;
    case LogLevel.ERROR:
      logger.error(message, context);
      break;
    default:
      // 未知のレベルの場合は警告ログを出力
      logger.warn(`[UNKNOWN LEVEL] ${message}`, context); // console.log を logger.warn に変更
  }
};

// 型安全性の向上のためのより明確な定義
interface CheckboxGroupProps {
  items: readonly string[]; // 不変配列として定義
  selectedItems: ReadonlyMap<string, boolean>; // 読み取り専用Mapとして定義
  onChange: (item: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  groupLabel: string;
  itemLabelPrefix: string;
  id?: string;
  'aria-labelledby'?: string;
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
    // メモ化の最適化: 依存配列を必要最小限に
    // useCallbackの依存配列を最適化し、コンポーネント定数を依存配列から除外
    const handleChange = useCallback(
      (item: string, checked: boolean) => {
        onChange(item, checked);

        // ログ出力を単純化
        logIfNeeded(`${groupLabel}フィルター変更`, LogLevel.DEBUG, {
          component: COMPONENT_NAMES.CHECKBOX_GROUP,
          action: 'change_filter',
          item,
          checked,
        });
      },
      [onChange, groupLabel]
    );

    const handleSelectAll = useCallback(() => {
      logIfNeeded(`${groupLabel}フィルター全選択`, LogLevel.INFO, {
        component: COMPONENT_NAMES.CHECKBOX_GROUP,
        action: 'select_all',
      });
      onSelectAll();
    }, [onSelectAll, groupLabel]);

    const handleDeselectAll = useCallback(() => {
      logIfNeeded(`${groupLabel}フィルター全解除`, LogLevel.INFO, {
        component: COMPONENT_NAMES.CHECKBOX_GROUP,
        action: 'deselect_all',
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
          {' '}
          {items.map(item => {
            // Object.hasOwnPropertyを使用してオブジェクトインジェクションを回避
            const isChecked = selectedItems.has(item) ? selectedItems.get(item) : false;

            return (
              <label key={item} className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={isChecked} // 安全に変換した値を使用
                  onChange={e => handleChange(item, e.target.checked)}
                  aria-label={`${item}${itemLabelPrefix}`}
                  className='filter-checkbox'
                />
                <span>{item}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }
);

CheckboxGroup.displayName = COMPONENT_NAMES.CHECKBOX_GROUP;

// より厳密な型定義
interface FilterPanelHeaderProps {
  isExpanded: boolean;
  togglePanel: () => void;
}

export const FilterPanelHeader: React.FC<FilterPanelHeaderProps> = React.memo(
  ({ isExpanded, togglePanel }) => {
    const handleToggle = useCallback(() => {
      // シンプルなログ出力
      logIfNeeded(`フィルターパネル ${isExpanded ? '折りたたみ' : '展開'}`, LogLevel.DEBUG, {
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
          // 不要なwillChangeスタイルを削除（KISS原則）
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
      // 開発環境での冗長なログ出力を削除 (YAGNI)
      // if (ENV.isDevelopment && newValue.length % 5 === 0) {
      //   logIfNeeded('検索キーワード入力', LogLevel.DEBUG, {
      //     component: COMPONENT_NAMES.SEARCH_INPUT,
      //     action: 'input_search',
      //     valueLength: newValue.length,
      //   });
      // }
      onChange(newValue);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    logIfNeeded('検索キーワードクリア', LogLevel.INFO, {
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
  value: StatusValue;
  onChange: (status: StatusValue) => void;
}

export const StatusFilterInput: React.FC<StatusFilterProps> = React.memo(({ value, onChange }) => {
  // パフォーマンス測定を簡素化（KISS原則）
  const handleChange = useCallback(
    (newValue: StatusValue) => {
      // 不要な測定を削除し、直接ログ出力
      logIfNeeded('営業状態フィルター変更', LogLevel.INFO, {
        component: COMPONENT_NAMES.STATUS_FILTER,
        action: 'change_status',
        previousValue: value,
        newValue,
      });
      onChange(newValue);
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
