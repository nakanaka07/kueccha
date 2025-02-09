import React from 'react';
import type { Poi } from '../../utils/types';
import './SearchResults.css';

interface SearchResultsProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
}) => {
  return (
    <div className="search-results">
      {results.map((poi) => (
        <div
          key={poi.id}
          className="search-result-item"
          onClick={() => onResultClick(poi)}
        >
          {poi.name}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
