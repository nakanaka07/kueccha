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
    console.log('LoadingFallback state:', { isLoading, isLoaded });
    let timer: NodeJS.Timeout;
    if (isLoaded) {
      timer = setTimeout(() => {
        setIsVisible(false);
        console.log('LoadingFallback hidden');
      }, 2000);
    } else {
      setIsVisible(isLoading);
    }
    return () => clearTimeout(timer);
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
        <p>
          しばらくお待ちください。ロードが完了しない場合は、ページをリロードしてください。
        </p>
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';

export { LoadingFallback };
export default LoadingFallback;
