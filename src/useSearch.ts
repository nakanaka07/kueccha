import { useState, useCallback, useRef, useEffect } from 'react';
import { AREAS } from './areas';
import type { Poi, LatLngLiteral } from '../../../core/types/poi';

const DEBOUNCE_DELAY = 300;

export interface SearchOptions {
  fields?: Array<keyof Poi>;
  mode?: 'AND' | 'OR';
  currentLocation?: LatLngLiteral | null;
  sortBy?: 'name' | 'area' | 'distance' | null;
  limit?: number | null;
}

const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  fields: ['name'],
  mode: 'AND',
  currentLocation: null,
  sortBy: null,
  limit: null,
};

export const useSearch = (pois: Poi[], defaultOptions: SearchOptions = DEFAULT_SEARCH_OPTIONS) => {
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOptions>(defaultOptions);
  const cache = useRef<Record<string, Poi[]>>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const getCacheKey = useCallback((searchQuery: string, searchOptions: SearchOptions): string => {
    const { fields, mode, sortBy, limit, currentLocation } = searchOptions;
    const fieldsStr = fields?.join(',') || '';
    const locationStr = currentLocation ? `${currentLocation.lat.toFixed(4)},${currentLocation.lng.toFixed(4)}` : '';

    return `${searchQuery}|${fieldsStr}|${mode}|${sortBy}|${limit}|${locationStr}`;
  }, []);

  const calculateDistance = useCallback((loc1: LatLngLiteral, loc2: LatLngLiteral): number => {
    if (!loc1 || !loc2) return Infinity;

    const R = 6371e3;
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const sortResults = useCallback(
    (results: Poi[], sortBy: SearchOptions['sortBy'], currentLocation: LatLngLiteral | null): Poi[] => {
      if (!sortBy || results.length === 0) return results;

      return [...results].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'area':
            const areaA = AREAS[a.area] || '';
            const areaB = AREAS[b.area] || '';
            return areaA.localeCompare(areaB);
          case 'distance':
            if (!currentLocation) return 0;
            const distA = calculateDistance(currentLocation, a.location);
            const distB = calculateDistance(currentLocation, b.location);
            return distA - distB;
          default:
            return 0;
        }
      });
    },
    [calculateDistance],
  );

  const performSearch = useCallback(
    (searchQuery: string, searchOptions: SearchOptions): Poi[] => {
      if (searchQuery === 'clear') return [];
      if (searchQuery === 'all') return pois;
      if (!searchQuery) return [];

      const { fields, mode, limit } = searchOptions;

      const terms = searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 0);
      if (terms.length === 0) return [];

      let results = pois.filter((poi) => {
        const termMatches = terms.map((term) => {
          return fields!.some((field) => {
            const value = poi[field];
            if (typeof value === 'string') {
              return value.toLowerCase().includes(term);
            }
            return false;
          });
        });

        return mode === 'AND' ? termMatches.every((match) => match) : termMatches.some((match) => match);
      });

      results = sortResults(results, searchOptions.sortBy, searchOptions.currentLocation ?? null);

      if (limit && limit > 0) {
        results = results.slice(0, limit);
      }

      return results;
    },
    [pois, sortResults],
  );

  const search = useCallback(
    (searchQuery: string, searchOptions: SearchOptions = options) => {
      setQuery(searchQuery);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        const cacheKey = getCacheKey(searchQuery, searchOptions);

        if (cache.current[cacheKey]) {
          setSearchResults(cache.current[cacheKey]);
          return;
        }

        const results = performSearch(searchQuery, searchOptions);
        cache.current[cacheKey] = results;
        setSearchResults(results);
      }, DEBOUNCE_DELAY);
    },
    [options, getCacheKey, performSearch],
  );

  const updateOptions = useCallback(
    (newOptions: Partial<SearchOptions>) => {
      setOptions((prevOptions) => ({
        ...prevOptions,
        ...newOptions,
      }));

      if (query) {
        const updatedOptions = { ...options, ...newOptions };
        search(query, updatedOptions);
      }
    },
    [options, query, search],
  );

  const clearCache = useCallback(() => {
    cache.current = {};
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    clearCache();
  }, [pois, clearCache]);

  return {
    searchResults,
    search,
    query,
    options,
    updateOptions,
    clearCache,
  };
};

export default useSearch;
