/*
 * 機能: 検索バーと検索結果を表示するコンテナコンポーネントを提供します
 * 依存関係:
 *   - React
 *   - SearchBar、SearchResultsコンポーネント
 *   - Poi型定義
 * 注意点:
 *   - isVisibleプロパティがfalseの場合は何も表示されません
 *   - 検索結果のクリックハンドリングが必要です
 */
import React from 'react';
import { SearchBar } from '../modules/search/components/SearchBarContainer';
import { SearchResults } from '../modules/search/components/SearchResults';
import type { Poi } from '../../types/poi';

interface SearchContainerProps {
  isVisible: boolean;
  pois: Poi[];
  search: (query: string) => void;
  searchResults: Poi[];
  handleSearchResultClick: (poi: Poi) => void;
}

export const SearchContainer: React.FC<SearchContainerProps> = ({
  isVisible,
  pois,
  search,
  searchResults,
  handleSearchResultClick,
}) => {
  if (!isVisible) return null;

  return (
    <>
      <SearchBar onSearch={search} pois={pois} />
      <SearchResults results={searchResults} onResultClick={handleSearchResultClick} />
    </>
  );
};
