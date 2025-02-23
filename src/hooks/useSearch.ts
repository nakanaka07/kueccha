// Reactのフックをインポートします。
// useState: 状態管理のためのフック
// useCallback: メモ化されたコールバック関数を作成するためのフック
// useRef: ミュータブルなrefオブジェクトを作成するためのフック
// useEffect: 副作用を処理するためのフック
import { useState, useCallback, useRef, useEffect } from 'react';
// POI（ポイントオブインタレスト）の型定義をインポートします。
import type { Poi } from '../utils/types';

// デバウンスの遅延時間を定義します（ミリ秒単位）。
const DEBOUNCE_DELAY = 300;

// useSearchフックを定義します。
// POIの配列を引数として受け取り、検索結果と検索関数を返します。
const useSearch = (pois: Poi[]) => {
  // 検索結果を管理する状態変数。初期値は空の配列です。
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  // 検索クエリを管理する状態変数。初期値は空文字列です。
  const [query, setQuery] = useState('');
  // 検索結果のキャッシュを管理するrefオブジェクト。初期値は空のオブジェクトです。
  const cache = useRef<Record<string, Poi[]>>({});
  // デバウンス用のタイムアウトIDを管理するrefオブジェクト。初期値はnullです。
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // 検索関数を定義します。検索クエリを引数として受け取ります。
  const search = useCallback(
    (query: string) => {
      // 検索クエリをログ出力します。
      console.log('Search query:', query);
      // 検索クエリを状態変数にセットします。
      setQuery(query);

      // 既存のデバウンスタイムアウトがある場合はクリアします。
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // 新しいデバウンスタイムアウトを設定します。
      debounceTimeout.current = setTimeout(() => {
        // クエリが'clear'の場合、検索結果をクリアします。
        if (query === 'clear') {
          setSearchResults([]);
          console.log('Search results cleared');
          return;
        }

        // クエリが'all'または空文字列の場合、全てのPOIを検索結果にセットします。
        if (query === 'all' || !query) {
          setSearchResults(pois);
          console.log('Search results set to all POIs');
          return;
        }

        // キャッシュにクエリが存在する場合、キャッシュから検索結果をセットします。
        if (cache.current[query]) {
          setSearchResults(cache.current[query]);
          console.log('Search results from cache:', cache.current[query]);
          return;
        }

        // クエリに基づいてPOIをフィルタリングします。
        const results = pois.filter((poi) => poi.name.toLowerCase().includes(query.toLowerCase()));

        // フィルタリング結果をキャッシュに保存します。
        cache.current[query] = results;
        // フィルタリング結果を検索結果にセットします。
        setSearchResults(results);
        console.log('Search results:', results);
      }, DEBOUNCE_DELAY);
    },
    [pois], // poisが変更された場合にのみこの関数を再生成します。
  );

  // コンポーネントのアンマウント時にデバウンスタイムアウトをクリアします。
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []); // 空の依存配列により、初回マウント時とアンマウント時にのみ実行されます。

  // 検索結果、検索関数、検索クエリを返します。
  return { searchResults, search, query };
};

export default useSearch;
