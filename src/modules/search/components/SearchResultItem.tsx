/*
 * 機能: 検索結果の個別アイテムを表示するReactコンポーネント
 * 依存関係:
 *   - React (useCallback)
 *   - SearchResults.module.css (スタイリング)
 *   - Poi型定義
 * 注意点:
 *   - クリックとキーボード操作（EnterとSpace）に対応
 *   - POIに詳細情報がない場合の代替テキスト表示対応
 *   - アクセシビリティに配慮した実装（tabIndex、role属性等）
 */

import React, { useCallback } from 'react';
import styles from './SearchResults.module.css';
import type { Poi } from '../../../types/poi';

interface SearchResultItemProps {
  poi: Poi;
  onResultClick: (poi: Poi) => void;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({ poi, onResultClick }) => {
  const handleClick = useCallback(() => {
    onResultClick(poi);
  }, [onResultClick, poi]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onResultClick(poi);
      }
    },
    [onResultClick, poi],
  );

  return (
    <div
      className={styles.searchResultItem}
      onClick={handleClick}
      role="option"
      aria-selected="false"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <h3>{poi.name}</h3>
      {typeof poi.description === 'string' && <p>{poi.description}</p>}
      {!poi.description && <p className={styles.noDescription}>詳細情報なし</p>}
      {poi.address && <p className={styles.address}>{poi.address}</p>}
    </div>
  );
};
