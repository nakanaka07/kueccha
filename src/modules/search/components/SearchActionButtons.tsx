// components/SearchActionButtons.tsx
import React from 'react';
import styles from './SearchBar.module.css';

interface SearchActionButtonsProps {
  onSearch: () => void;
  onClear: () => void;
  onShowAll: () => void;
}

export const SearchActionButtons: React.FC<SearchActionButtonsProps> = ({ onSearch, onClear, onShowAll }) => {
  return (
    <div className={styles.searchButtons}>
      <button onClick={onSearch} className={styles.searchButton}>
        検索
      </button>
      <button onClick={onClear} className={styles.searchButton}>
        クリア
      </button>
      <button onClick={onShowAll} className={styles.searchButton}>
        一覧
      </button>
    </div>
  );
};
