import { useState, useCallback, useRef, useEffect } from 'react';
import type { Poi } from '../utils/types';

/**
 * POIデータの検索機能を提供するカスタムフック
 *
 * このフックは、POI（Point of Interest）配列に対する検索機能を実装し、
 * デバウンス処理とキャッシング機能によってパフォーマンスを最適化します。
 * 特定のキーワード('clear', 'all')に対する特殊処理も実装しています。
 *
 * @param {Poi[]} pois - 検索対象となるPOI（Point of Interest）の配列
 * @returns {Object} 検索関連の状態と操作関数を含むオブジェクト
 *   @property {Poi[]} searchResults - 検索結果のPOI配列
 *   @property {function} search - 検索を実行する関数（クエリ文字列を引数に取る）
 *   @property {string} query - 現在の検索クエリ文字列
 *
 * @example
 * function SearchComponent({ poisData }) {
 *   const { searchResults, search, query } = useSearch(poisData);
 *
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         value={query}
 *         onChange={(e) => search(e.target.value)}
 *         placeholder="検索..."
 *       />
 *       <ul>
 *         {searchResults.map((poi) => (
 *           <li key={poi.id}>{poi.name}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - 入力の度に検索が実行されるのを防ぐため、300ミリ秒のデバウンス処理が適用されています
 * - 検索結果はクエリ文字列ごとにキャッシュされるため、同じ検索の再実行は高速です
 * - 'clear'を検索すると結果がクリアされ、'all'を検索すると全POIが表示されます
 * - 検索は大文字小文字を区別せず、部分一致で行われます
 */
const DEBOUNCE_DELAY = 300;

const useSearch = (pois: Poi[]) => {
  // 検索結果を管理する状態変数
  const [searchResults, setSearchResults] = useState<Poi[]>([]);
  // 検索クエリを管理する状態変数
  const [query, setQuery] = useState('');
  // 検索結果のキャッシュを管理するrefオブジェクト
  const cache = useRef<Record<string, Poi[]>>({});
  // デバウンス用のタイムアウトIDを管理するrefオブジェクト
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * 検索を実行する関数
   * 入力のデバウンス処理、キャッシュチェック、特殊キーワード処理を行います
   *
   * @param {string} query - 検索クエリ文字列
   */
  const search = useCallback(
    (query: string) => {
      setQuery(query);

      // 既存のデバウンスタイムアウトがある場合はクリア
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // デバウンス処理を適用
      debounceTimeout.current = setTimeout(() => {
        // 特殊キーワード: 'clear' - 結果をクリア
        if (query === 'clear') {
          setSearchResults([]);
          return;
        }

        // 特殊キーワード: 'all' - 全POIを表示
        if (query === 'all') {
          setSearchResults(pois);
          return;
        }

        // 空クエリの場合は空の結果を返す
        if (!query) {
          setSearchResults([]);
          return;
        }

        // キャッシュチェック
        if (cache.current[query]) {
          setSearchResults(cache.current[query]);
          return;
        }

        // キャッシュにない場合は新規検索を実行
        const results = pois.filter((poi) => poi.name.toLowerCase().includes(query.toLowerCase()));

        // 結果をキャッシュに保存
        cache.current[query] = results;
        setSearchResults(results);
      }, DEBOUNCE_DELAY);
    },
    [pois],
  );

  // クリーンアップ: コンポーネントのアンマウント時にタイムアウトをクリア
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
