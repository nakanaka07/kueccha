import React from 'react';
import styles from './SearchResults.module.css';
import { SearchResultItem } from './SearchResultItem';
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
