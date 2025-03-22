import { useState, useCallback, useRef, useEffect } from 'react';

import type { Poi } from '../types/types';

/**
 * POIを検索するためのカスタムフック
 */
const useSearch = (pois: Poi[]) => {
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  const [query, setQuery] = useState('');
  const cache = useRef<Record<string, Poi[]>>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    (query: string) => {
      setQuery(query);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        if (query === 'clear') {
          setSearchResults([]);
          return;
        }

        if (query === 'all' || !query) {
          setSearchResults(pois);
          return;
        }

        if (cache.current[query]) {
          setSearchResults(cache.current[query]);
          return;
        }

        const results = pois.filter((poi) => poi.name.toLowerCase().includes(query.toLowerCase()));

        cache.current[query] = results;
        setSearchResults(results);
      }, 300);
    },
    [pois],
  );

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return { searchResults, search, query };
};

export default useSearch;
