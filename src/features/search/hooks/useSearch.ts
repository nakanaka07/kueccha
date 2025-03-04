import { useState, useCallback, useRef, useEffect } from 'react';
import { AREAS } from '../../../constants/areas';
import type { Poi, LatLngLiteral } from '../../../types/poi';

const DEBOUNCE_DELAY = 300;

// 検索オプションの型定義
export interface SearchOptions {
  // 検索対象フィールド（デフォルトでは name のみ）
  fields?: Array<keyof Poi>;
  // 検索モード（'AND'は全ての単語を含む、'OR'はいずれかの単語を含む）
  mode?: 'AND' | 'OR';
  // 距離でソートする場合の現在位置
  currentLocation?: LatLngLiteral | null;
  // ソート方法
  sortBy?: 'name' | 'area' | 'distance' | null;
  // 最大結果数（制限なしの場合はnull）
  limit?: number | null;
}

// デフォルトの検索オプション
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  fields: ['name'],
  mode: 'AND',
  currentLocation: null,
  sortBy: null,
  limit: null,
};

/**
 * POIを検索するカスタムフック
 * @param pois 検索対象のPOI配列
 * @param defaultOptions 検索オプション
 * @returns 検索結果と関連機能を含むオブジェクト
 */
export const useSearch = (pois: Poi[], defaultOptions: SearchOptions = DEFAULT_SEARCH_OPTIONS) => {
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOptions>(defaultOptions);
  const cache = useRef<Record<string, Poi[]>>({});
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // キャッシュキーの生成（クエリとオプションから一意のキーを作成）
  const getCacheKey = useCallback((searchQuery: string, searchOptions: SearchOptions): string => {
    const { fields, mode, sortBy, limit, currentLocation } = searchOptions;
    const fieldsStr = fields?.join(',') || '';
    const locationStr = currentLocation ? `${currentLocation.lat.toFixed(4)},${currentLocation.lng.toFixed(4)}` : '';

    return `${searchQuery}|${fieldsStr}|${mode}|${sortBy}|${limit}|${locationStr}`;
  }, []);

  // 2点間の距離を計算する関数
  const calculateDistance = useCallback((loc1: LatLngLiteral, loc2: LatLngLiteral): number => {
    if (!loc1 || !loc2) return Infinity;

    // ヒュベニの公式で距離を概算
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // メートル単位の距離
  }, []);

  // 検索結果のソート
  const sortResults = useCallback(
    (results: Poi[], sortBy: SearchOptions['sortBy'], currentLocation: LatLngLiteral | null): Poi[] => {
      if (!sortBy || results.length === 0) return results;

      return [...results].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'area':
            // エリア名で比較
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

  // 検索ロジック
  const performSearch = useCallback(
    (searchQuery: string, searchOptions: SearchOptions): Poi[] => {
      if (searchQuery === 'clear') return [];
      if (searchQuery === 'all') return pois;
      if (!searchQuery) return [];

      const { fields, mode, limit } = searchOptions;

      // 検索語を空白で分割
      const terms = searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 0);
      if (terms.length === 0) return [];

      // 検索実行
      let results = pois.filter((poi) => {
        // 各検索語について
        const termMatches = terms.map((term) => {
          // 指定されたフィールドで検索
          return fields!.some((field) => {
            const value = poi[field];
            // 文字列フィールドのみ検索
            if (typeof value === 'string') {
              return value.toLowerCase().includes(term);
            }
            return false;
          });
        });

        // AND検索（すべての語がマッチ）またはOR検索（いずれかの語がマッチ）
        return mode === 'AND' ? termMatches.every((match) => match) : termMatches.some((match) => match);
      });

      // ソート
      results = sortResults(results, searchOptions.sortBy, searchOptions.currentLocation ?? null);

      // 結果数の制限
      if (limit && limit > 0) {
        results = results.slice(0, limit);
      }

      return results;
    },
    [pois, sortResults],
  );

  // 検索実行のメイン関数
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

  // 検索オプションの更新
  const updateOptions = useCallback(
    (newOptions: Partial<SearchOptions>) => {
      setOptions((prevOptions) => ({
        ...prevOptions,
        ...newOptions,
      }));

      // オプション変更時に現在のクエリで再検索
      if (query) {
        const updatedOptions = { ...options, ...newOptions };
        search(query, updatedOptions);
      }
    },
    [options, query, search],
  );

  // キャッシュのクリア
  const clearCache = useCallback(() => {
    cache.current = {};
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // 検索対象のPOIが変わったらキャッシュをクリア
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
