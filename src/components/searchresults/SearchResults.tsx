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
      console.log('Result clicked:', poi); // ログ出力を追加
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
          <h3>{poi.name}</h3>
          <p>
            {typeof poi.description === 'string'
              ? poi.description
              : 'No description available'}
          </p>{' '}
          {/* 詳細情報を追加 */}
          <p>{poi.address}</p> {/* 住所を追加 */}
        </div>
      ))}
    </div>
  );
};

export default React.memo(SearchResults);
