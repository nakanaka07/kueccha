import React, { useState, useEffect, useCallback } from 'react';
import styles from './SearchBar.module.css';
import type { Poi } from '../../../types/poi';
import type { SearchBarProps } from '../../../types/search';

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
    <div className={styles.searchBar}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="検索..."
        className={styles.searchInput}
      />

      <div className={styles.searchButtons}>
        <button onClick={handleSearch} className={styles.searchButton}>
          検索
        </button>

        <button onClick={handleClear} className={styles.searchButton}>
          クリア
        </button>

        <button onClick={handleShowAll} className={styles.searchButton}>
          一覧
        </button>
      </div>

      <div className={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} onClick={() => handleSuggestionClick(suggestion)} className={styles.suggestionItem}>
            {suggestion.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
