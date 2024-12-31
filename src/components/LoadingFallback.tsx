import React from 'react';

interface LoadingFallbackProps {
  isLoading: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75"
      role="alert"
      aria-busy="true"
    >
      <div className="text-center">
        <div
          className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
        <p className="mt-2 text-gray-700">読み込み中...</p>
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';
