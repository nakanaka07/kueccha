// hooks/useSearchLogic.ts
import { useState, useEffect, useCallback } from 'react';
import type { Poi } from '../../../types/poi';

interface UseSearchLogicProps {
  pois: Poi[];
  onSearch: (query: string) => void;
}

export function useSearchLogic({ pois, onSearch }: UseSearchLogicProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Poi[]>([]);

  // 入力に基づいたサジェスト候補の更新
  useEffect(() => {
    if (query) {
      const filteredSuggestions = pois.filter((poi) =>
        poi.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, pois]);

  // 検索処理
  const handleSearch = useCallback(() => {
    onSearch(query);
  }, [onSearch, query]);

  // クリア処理
  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    onSearch('clear');
  }, [onSearch]);

  // 全表示処理
  const handleShowAll = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    onSearch('all');
  }, [onSearch]);

  // サジェスト選択処理
  const handleSuggestionClick = useCallback(
    (suggestion: Poi) => {
      setQuery(suggestion.name);
      setSuggestions([]);
      onSearch(suggestion.name);
    },
    [onSearch],
  );

  return {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleClear,
    handleShowAll,
    handleSuggestionClick
  };
}