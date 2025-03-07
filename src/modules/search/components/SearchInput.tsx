// components/SearchInput.tsx
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
