import React, { useCallback } from 'react';

import type { Poi, SearchResultsProps } from '../../utils/types';

const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  const handleResultClick = useCallback(
    (poi: Poi) => {
      onResultClick(poi);
    },
    [onResultClick],
  );

  if (results.length === 0) {
    return (
      <div role="status" aria-live="polite">
        検索結果がありません
      </div>
    );
  }

  return (
    <div role="listbox" aria-label="検索結果">
      {results.map((poi) => (
        <div
          key={poi.id}
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
          {!poi.description && <p>詳細情報なし</p>}

          {poi.address && <p>{poi.address}</p>}
        </div>
      ))}
    </div>
  );
};

export default React.memo(SearchResults);
