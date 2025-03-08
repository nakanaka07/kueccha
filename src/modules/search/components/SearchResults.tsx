/*
 * 機能: 検索結果一覧を表示するReactコンポーネント
 * 依存関係:
 *   - React
 *   - SearchResultItem コンポーネント
 *   - SearchResults.module.css (スタイリング)
 *   - SearchResultsProps 型定義
 * 注意点:
 *   - 検索結果が空の場合は「検索結果がありません」メッセージを表示
 *   - React.memoによるパフォーマンス最適化済み
 *   - アクセシビリティ対応のためのWAI-ARIA属性実装
 */

import React from 'react';
import { SearchResultItem } from './SearchResultItem';
import styles from './SearchResults.module.css';
import type { SearchResultsProps } from '../../../types/search';

const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  if (results.length === 0) {
    return (
      <div className={styles.noResults} role="status" aria-live="polite">
        検索結果がありません
      </div>
    );
  }

  return (
    <div className={styles.searchResults} role="listbox" aria-label="検索結果">
      {results.map((poi) => (
        <SearchResultItem key={poi.id} poi={poi} onResultClick={onResultClick} />
      ))}
    </div>
  );
};

export default React.memo(SearchResults);
