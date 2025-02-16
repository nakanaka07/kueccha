import React, { useEffect, useState } from 'react';
import './LoadingFallback.css';
import { ERROR_MESSAGES } from '../../utils/constants';
import type { LoadingFallbackProps } from '../../utils/types';

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading,
  isLoaded,
  message = ERROR_MESSAGES.LOADING.DATA,
}) => {
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(isLoading);
    }
  }, [isLoaded, isLoading]);

  if (!isVisible) return null;

  return (
    <div
      className={`loading-fallback ${isLoaded ? 'hidden' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" />
        <p>{message}</p>
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';

export { LoadingFallback };
export default LoadingFallback;
