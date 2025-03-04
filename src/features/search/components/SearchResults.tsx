import React, { useCallback } from 'react';
import styles from './SearchResults.module.css';
import type { Poi } from '../../../types/poi';
import type { SearchResultsProps } from '../../../types/search';

const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  const handleResultClick = useCallback(
    (poi: Poi) => {
      onResultClick(poi);
    },
    [onResultClick],
  );

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
        <div
          key={poi.id}
          className={styles.searchResultItem}
          onClick={() => handleResultClick(poi)}
          role="option"
          aria-selected="false"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleResultClick(poi);
            }
          }}
        >
          <h3>{poi.name}</h3>
          {typeof poi.description === 'string' && <p>{poi.description}</p>}
          {!poi.description && <p className={styles.noDescription}>詳細情報なし</p>}
          {poi.address && <p className={styles.address}>{poi.address}</p>}
        </div>
      ))}
    </div>
  );
};

export default React.memo(SearchResults);
