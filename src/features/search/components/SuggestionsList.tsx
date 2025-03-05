// components/SuggestionsList.tsx
import React from 'react';
import styles from './SearchBar.module.css';
import type { Poi } from '../../../types/poi';

interface SuggestionsListProps {
  suggestions: Poi[];
  onSuggestionClick: (suggestion: Poi) => void;
}

export const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions, onSuggestionClick
}) => {
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