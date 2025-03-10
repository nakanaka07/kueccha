/*
 * 機能: 検索サジェスト（候補）のリストを表示するReactコンポーネント
 * 依存関係:
 *   - React
 *   - SearchBar.module.css (スタイリング)
 *   - Poi型定義
 * 注意点:
 *   - サジェスト候補がない場合は何も表示しない（nullを返す）
 *   - アクセシビリティ対応のためのrole属性実装済み
 *   - マウスクリックおよびキーボード操作に対応
 */

import React from 'react';
import styles from './SearchBar.module.css';
import type { Poi } from '../../../core/types/poi';

interface SuggestionsListProps {
  suggestions: Poi[];
  onSuggestionClick: (suggestion: Poi) => void;
}

export const SuggestionsList: React.FC<SuggestionsListProps> = ({ suggestions, onSuggestionClick }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className={styles.suggestions} role="listbox">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          onClick={() => onSuggestionClick(suggestion)}
          className={styles.suggestionItem}
          role="option"
          tabIndex={0}
        >
          {suggestion.name}
        </div>
      ))}
    </div>
  );
};
