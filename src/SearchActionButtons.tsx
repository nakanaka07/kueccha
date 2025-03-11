import React from 'react';

interface SearchActionButtonsProps {
  onSearch: () => void;
  onClear: () => void;
  onShowAll: () => void;
}

export const SearchActionButtons: React.FC<SearchActionButtonsProps> = ({ onSearch, onClear, onShowAll }) => {
  return (
    <div className="searchButtons">
      <button onClick={onSearch} className="searchButton">
        検索
      </button>
      <button onClick={onClear} className="searchButton">
        クリア
      </button>
      <button onClick={onShowAll} className="searchButton">
        一覧
      </button>
    </div>
  );
};
