/*
 * 機能: 検索入力フィールドを提供するReactコンポーネント
 * 依存関係:
 *   - React
 *   - SearchBar.module.css (スタイリング)
 * 注意点:
 *   - アクセシビリティ対応のためのaria-label属性を実装
 *   - プレースホルダーテキストとしてデフォルト「検索...」を表示
 *   - 親コンポーネントから渡される値と変更ハンドラに依存
 */

import React from 'react';
import styles from './SearchBar.module.css';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder="検索..."
      className={styles.searchInput}
      aria-label="キーワード検索"
    />
  );
};
