import React, { useEffect, useState } from 'react';
import type { LoadingFallbackProps } from '../../utils/types';
import { ERROR_MESSAGES } from '../../utils/constants';
import './LoadingFallback.css';

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ isLoading }) => {
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div
      className={`loading-fallback ${!isLoading ? 'hidden' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" />
        <p>{ERROR_MESSAGES.LOADING.DATA}</p>
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';

export { LoadingFallback };
export default LoadingFallback;
