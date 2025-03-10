import React, { useCallback } from 'react';
import type { Poi } from '../../../core/types/poi';

interface SearchResultItemProps {
  poi: Poi;
  onResultClick: (poi: Poi) => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ poi, onResultClick }) => {
  const handleClick = useCallback(() => {
    onResultClick(poi);
  }, [onResultClick, poi]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onResultClick(poi);
      }
    },
    [onResultClick, poi],
  );

  return (
    <div onClick={handleClick} role="option" aria-selected="false" tabIndex={0} onKeyDown={handleKeyDown}>
      <h3>{poi.name}</h3>
      {typeof poi.description === 'string' && <p>{poi.description}</p>}
      {!poi.description && <p>詳細情報なし</p>}
      {poi.address && <p>{poi.address}</p>}
    </div>
  );
};
