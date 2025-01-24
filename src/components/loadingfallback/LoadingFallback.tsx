import React, { useEffect, useState } from 'react';
import type { LoadingFallbackProps } from '../../utils/types';
import { ERROR_MESSAGES } from '../../utils/constants';
import './LoadingFallback.css';

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ isLoading, isLoaded }) => {
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  if (!isVisible) return null;

  return (
    <div
      className={`loading-fallback ${isLoaded ? 'hidden' : ''}`}
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
