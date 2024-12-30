import React from 'react';

interface LoadingFallbackProps {
  isLoading: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-fallback">
      <div className="spinner"></div>
      <p>読み込み中...</p>
    </div>
  );
};
