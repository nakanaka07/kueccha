import React, { useState, useEffect, useCallback } from 'react';
import './SearchBar.module.css';
import { Poi, SearchBarProps } from '../../utils/types';

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Poi[]>([]);

  useEffect(() => {
    if (query) {
      const filteredSuggestions = pois.filter((poi) => poi.name.toLowerCase().includes(query.toLowerCase()));
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, pois]);

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

  return (
    <div className="search-bar">
      <input type="text" value={query} onChange={handleInputChange} placeholder="検索..." className="search-input" />

      <div className="search-buttons">
        <button onClick={handleSearch} className="search-button">
          検索
        </button>

        <button onClick={handleClear} className="search-button">
          クリア
        </button>

        <button onClick={handleShowAll} className="search-button">
          一覧
        </button>
      </div>

      <div className="suggestions">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)} className="suggestion-item">
            {suggestion.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
