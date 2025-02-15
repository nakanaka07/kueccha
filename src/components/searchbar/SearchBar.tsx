import React, { useState, useEffect } from 'react';
import { Poi } from '../../utils/types'; // Poi型をインポート
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  pois: Poi[]; // POIの配列を受け取る
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Poi[]>([]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSearch('clear'); // 'clear' という特別なクエリを渡す
  };

  const handleShowAll = () => {
    setQuery('');
    setSuggestions([]);
    onSearch('all'); // 'all' という特別なクエリを渡して全てのPOIを表示
  };

  const handleSuggestionClick = (suggestion: Poi) => {
    setQuery(suggestion.name);
    setSuggestions([]);
    onSearch(suggestion.name);
  };

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
