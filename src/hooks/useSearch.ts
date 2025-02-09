import { useState, useCallback } from 'react';
import type { Poi } from '../utils/types';

const useSearch = (pois: Poi[]) => {
  const [searchResults, setSearchResults] = useState<Poi[]>(pois);

  const search = useCallback(
    (query: string) => {
      if (!query) {
        setSearchResults(pois);
        return;
      }

      const results = pois.filter((poi) =>
        poi.name.toLowerCase().includes(query.toLowerCase()),
      );
      setSearchResults(results);
    },
    [pois],
  );

  return { searchResults, search };
};

export default useSearch;
