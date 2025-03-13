import React, { useEffect, useState } from 'react';
import { ERROR_MESSAGES } from '../../utils/constants';
import type { LoadingFallbackProps } from '../../utils/types';

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading,
  isLoaded,
  message = ERROR_MESSAGES.LOADING.DATA,
  fadeDuration = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(isLoading);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isLoading && isLoaded) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, fadeDuration);
      return () => clearTimeout(timer);
    } else {
      setIsFading(false);
      setIsVisible(true);
    }
  }, [isLoaded, isLoading, fadeDuration]);

  if (!isVisible) return null;

  return (
    <div>
      <div>
        <div role="status" aria-live="polite" />
        <p>{message}</p>
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';
export { LoadingFallback };
export default LoadingFallback;
