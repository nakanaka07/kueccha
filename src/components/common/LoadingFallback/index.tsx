import React from 'react';
import type { LoadingFallbackProps } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants/messages';

const LoadingFallback = React.memo(({ isLoading, className = '', style }: LoadingFallbackProps) => {
  if (!isLoading) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
      style={style}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-700">{ERROR_MESSAGES.LOADING.DATA}</p>
      </div>
    </div>
  );
});

LoadingFallback.displayName = 'LoadingFallback';

export { LoadingFallback };
export default LoadingFallback;
