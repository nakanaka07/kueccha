import { useState, useCallback, useRef } from 'react';
import type { Poi } from '../utils/types';

const DEBOUNCE_DELAY = 300;

const useSearch = (pois: Poi[]) => {
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  const [query, setQuery] = useState('');
  const cache = useRef<Record<string, Poi[]>>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    (query: string) => {
      console.log('Search query:', query); // ログ出力を追加
      setQuery(query);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        if (query === 'clear') {
          setSearchResults([]);
          console.log('Search results cleared'); // ログ出力を追加
          return;
        }

        if (query === 'all' || !query) {
          setSearchResults(pois);
          console.log('Search results set to all POIs'); // ログ出力を追加
          return;
        }

        if (cache.current[query]) {
          setSearchResults(cache.current[query]);
          console.log('Search results from cache:', cache.current[query]); // ログ出力を追加
          return;
        }

        const results = pois.filter((poi) =>
          poi.name.toLowerCase().includes(query.toLowerCase()),
        );

        cache.current[query] = results;
        setSearchResults(results);
        console.log('Search results:', results); // ログ出力を追加
      }, DEBOUNCE_DELAY);
    },
    [pois],
  );

  return { searchResults, search, query };
};

export default useSearch;
