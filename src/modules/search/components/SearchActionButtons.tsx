/*
 * 機能: 検索バーのアクションボタン群（検索、クリア、一覧）を提供するReactコンポーネント
 * 依存関係:
 *   - React
 *   - SearchBar.module.css (スタイリング)
 * 注意点:
 *   - 3つのボタン（検索、クリア、一覧）を提供
 *   - 各ボタンのクリックイベントハンドラは親コンポーネントから渡される
 *   - レスポンシブデザインに対応したスタイリングが必要
 */

import React from 'react';
import styles from './SearchBar.module.css';

interface SearchActionButtonsProps {
  onSearch: () => void;
  onClear: () => void;
  onShowAll: () => void;
}

export const SearchActionButtons: React.FC<SearchActionButtonsProps> = ({ onSearch, onClear, onShowAll }) => {
  return (
    <div className={styles.searchButtons}>
      <button onClick={onSearch} className={styles.searchButton}>
        検索
      </button>
      <button onClick={onClear} className={styles.searchButton}>
        クリア
      </button>
      <button onClick={onShowAll} className={styles.searchButton}>
        一覧
      </button>
    </div>
  );
};
