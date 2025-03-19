import React, { useState, useEffect, useCallback } from 'react';

import type { Poi, SearchBarProps } from '../types/types';

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Poi[]>([]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleSearch = useCallback(() => {
    onSearch(query);
  }, [onSearch, query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    onSearch('clear');
  }, [onSearch]);

  const handleShowAll = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    onSearch('all');
  }, [onSearch]);

  const handleSuggestionClick = useCallback(
    (suggestion: Poi) => {
      setQuery(suggestion.name);
      setSuggestions([]);
      onSearch(suggestion.name);
    },
    [onSearch],
  );

  useEffect(() => {
    if (query) {
      const filteredSuggestions = pois.filter((poi) =>
        poi.name.toLowerCase().includes(query.toLowerCase()),
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, pois]);

  return (
    <div>
      <input type="text" value={query} onChange={handleInputChange} placeholder="検索..." />

      <div>
        <button onClick={handleSearch}>検索</button>
        <button onClick={handleClear}>クリア</button>
        <button onClick={handleShowAll}>一覧</button>
      </div>

      <div>
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)}>
            {suggestion.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
