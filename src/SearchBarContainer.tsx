import React, { useCallback } from 'react';
import { SearchActionButtons } from './SearchActionButtons';
import { SearchInput } from './SearchInput';
import { SuggestionsList } from './SuggestionsList';
import { useSearchLogic } from './use/useSearchLogic';
import type { SearchBarProps } from './search';

const SearchBarContainer: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  const { query, setQuery, suggestions, handleSearch, handleClear, handleShowAll, handleSuggestionClick } =
    useSearchLogic({ pois, onSearch });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [setQuery],
  );

  return (
    <div className="searchBar">
      <SearchInput value={query} onChange={handleInputChange} />

      <SearchActionButtons onSearch={handleSearch} onClear={handleClear} onShowAll={handleShowAll} />

      <SuggestionsList suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
    </div>
  );
};

export default SearchBarContainer;
