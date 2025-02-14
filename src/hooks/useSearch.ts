import { useState, useCallback, useRef } from 'react';
import type { Poi } from '../utils/types';

const useSearch = (pois: Poi[]) => {
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  const [query, setQuery] = useState('');
  const cache = useRef<{ [key: string]: Poi[] }>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    (query: string) => {
      setQuery(query);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        if (query === 'clear') {
          setSearchResults([]); // 検索結果を空にする
          return;
        }

        if (query === 'all') {
          setSearchResults(pois); // 全てのPOIを表示
          return;
        }

        if (!query) {
          setSearchResults(pois);
          return;
        }

        if (cache.current[query]) {
          setSearchResults(cache.current[query]);
          return;
        }

        const results = pois.filter((poi) =>
          poi.name.toLowerCase().includes(query.toLowerCase()),
        );

        cache.current[query] = results;
        setSearchResults(results);
      }, 300); // デバウンス時間を300msに設定
    },
    [pois],
  );

  return { searchResults, search, query };
};

export default useSearch;
