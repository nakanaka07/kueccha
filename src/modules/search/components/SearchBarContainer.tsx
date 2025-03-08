/*
 * 機能: 検索バー全体のコンテナコンポーネント。入力、ボタン、サジェストを統合管理
 * 依存関係:
 *   - React (useCallback)
 *   - SearchActionButtons、SearchInput、SuggestionsList コンポーネント
 *   - useSearchLogic カスタムフック
 *   - SearchBar.module.css (スタイリング)
 *   - SearchBarProps 型定義
 * 注意点:
 *   - 検索ロジックはuseSearchLogicフックに委譲
 *   - 入力変更、検索実行、クリア、全件表示の各アクションに対応
 *   - サジェスト候補のクリック処理を実装
 */

import React, { useCallback } from 'react';
import { SearchActionButtons } from './SearchActionButtons';
import styles from './SearchBar.module.css';
import { SearchInput } from './SearchInput';
import { SuggestionsList } from './SuggestionsList';
import { useSearchLogic } from '../hooks/useSearchLogic';
import type { SearchBarProps } from '../../../types/search';

const SearchBarContainer: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  const { query, setQuery, suggestions, handleSearch, handleClear, handleShowAll, handleSuggestionClick } =
    useSearchLogic({ pois, onSearch });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [setQuery],
  );

  return (
    <div className={styles.searchBar}>
      <SearchInput value={query} onChange={handleInputChange} />

      <SearchActionButtons onSearch={handleSearch} onClear={handleClear} onShowAll={handleShowAll} />

      <SuggestionsList suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
    </div>
  );
};

export default SearchBarContainer;
