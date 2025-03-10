import React from 'react';
import type { Poi } from '../../../core/types/poi';

interface SuggestionsListProps {
  suggestions: Poi[];
  onSuggestionClick: (suggestion: Poi) => void;
}

export const SuggestionsList: React.FC<SuggestionsListProps> = ({ suggestions, onSuggestionClick }) => {
  if (suggestions.length === 0) return null;

  return (
    <div role="listbox">
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} onClick={() => onSuggestionClick(suggestion)} role="option" tabIndex={0}>
          {suggestion.name}
        </div>
      ))}
    </div>
  );
};
