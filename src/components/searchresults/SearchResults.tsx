import React, { useCallback } from 'react';
import type { Poi } from '../../utils/types';
import './SearchResults.css';

/**
 * 検索結果コンポーネントのプロパティ定義
 * @property {Poi[]} results - 表示する検索結果のPOI配列
 * @property {Function} onResultClick - 検索結果項目がクリックされたときのコールバック関数
 */
interface SearchResultsProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
}

/**
 * 検索結果を表示するコンポーネント
 * 検索結果の各項目をクリック可能なリストとして表示します
 *
 * @param {SearchResultsProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} 検索結果リストを表示するJSX要素
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
}) => {
  /**
   * 検索結果項目クリック時のハンドラー
   * @param {Poi} poi - クリックされたPOI
   */
  const handleResultClick = useCallback(
    (poi: Poi) => {
      onResultClick(poi);
    },
    [onResultClick],
  );

  return (
    <div className="search-results">
      {results.map((poi) => (
        <div
          key={poi.id}
          className="search-result-item"
          onClick={() => handleResultClick(poi)}
        >
          {poi.name}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
