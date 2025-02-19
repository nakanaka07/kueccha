import React, { useState, useEffect, useCallback } from 'react';
import './SearchBar.css';
import { Poi, SearchBarProps } from '../../utils/types';

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Poi[]>([]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('Input changed:', e.target.value); // ログ出力を追加
      setQuery(e.target.value);
    },
    [],
  );

  const handleSearch = useCallback(() => {
    console.log('Search initiated with query:', query); // ログ出力を追加
    onSearch(query);
  }, [onSearch, query]);

  const handleClear = useCallback(() => {
    console.log('Search cleared'); // ログ出力を追加
    setQuery('');
    setSuggestions([]);
    onSearch('clear');
  }, [onSearch]);

  const handleShowAll = useCallback(() => {
    console.log('Show all POIs'); // ログ出力を追加
    setQuery('');
    setSuggestions([]);
    onSearch('all');
  }, [onSearch]);

  const handleSuggestionClick = useCallback(
    (suggestion: Poi) => {
      console.log('Suggestion clicked:', suggestion); // ログ出力を追加
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
      console.log('Suggestions updated:', filteredSuggestions); // ログ出力を追加
    } else {
      setSuggestions([]);
    }
  }, [query, pois]);

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="検索..."
      />
      <button onClick={handleSearch}>検索</button>
      <button onClick={handleClear}>クリア</button>
      <button onClick={handleShowAll}>一覧</button>
      <div className="suggestions">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            onClick={() => handleSuggestionClick(suggestion)}
            className="suggestion-item"
          >
            {suggestion.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
