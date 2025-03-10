/*
 * 機能: 検索バーのロジックを管理するためのカスタムフック
 * 依存関係:
 *   - React (useState, useEffect, useCallback)
 *   - Poiオブジェクト型定義
 * 注意点:
 *   - 検索文字列によるPOIのフィルタリング機能を提供
 *   - 検索、クリア、全件表示、サジェスト選択のハンドラーを提供
 *   - 親コンポーネントから渡されるPOIの配列と検索実行関数に依存
 */

import { useState, useEffect, useCallback } from 'react';
import type { Poi } from '../../../core/types/poi';

interface UseSearchLogicProps {
  pois: Poi[];
  onSearch: (query: string) => void;
}

export function useSearchLogic({ pois, onSearch }: UseSearchLogicProps) {
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

  return {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleClear,
    handleShowAll,
    handleSuggestionClick,
  };
}
