import React, { useCallback } from 'react';
import styles from './SearchResults.module.css';
import type { Poi } from '../../utils/types';

interface SearchResultsProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
}) => {
  const handleResultClick = useCallback(
    (poi: Poi) => {
      onResultClick(poi);
    },
    [onResultClick],
  );

  return (
    <div className={styles.searchResults}>
      {results.map((poi) => (
        <div
          key={poi.id}
          className={styles.searchResultItem}
          onClick={() => handleResultClick(poi)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleResultClick(poi);
            }
          }}
        >
          {poi.name}
        </div>
      ))}
    </div>
  );
};

export default React.memo(SearchResults);
