import React from 'react';
import SearchBar from '../../../modules/search/components/SearchBarContainer';
import SearchResults from '../../../modules/search/components/SearchResults';
import type { Poi } from '../../../core/types/poi';

interface SearchContainerProps {
  isVisible: boolean;
  pois: Poi[];
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}

export const SearchContainer: React.FC<SearchContainerProps> = ({
  isVisible,
  pois,
  search,
  searchResults,
  handleSearchResultClick,
}) => {
  if (!isVisible) return null;

  return (
    <>
      <SearchBar onSearch={search} pois={pois} />
      <SearchResults results={searchResults} onResultClick={handleSearchResultClick} />
    </>
  );
};
