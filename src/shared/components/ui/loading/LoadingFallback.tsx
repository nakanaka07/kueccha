import React, { memo } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import styles from './LoadingFallback.module.css';
import { LoadingVariant } from './LoadingVariant';
import { ERROR_MESSAGES } from '../constants/messages';
import { useLoadingState } from '../core/hooks/useLoadingState';

interface LoadingFallbackProps {
  isLoading: boolean;
  isLoaded: boolean;
  error?: Error | null;
  message?: string;
  errorMessage?: string;
  fadeDuration?: number;
  onRetry?: () => void;
  variant?: 'spinner' | 'skeleton' | 'progress';
  showOverlay?: boolean;
  spinnerClassName?: string;
  isFading?: boolean;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading,
  isLoaded,
  error = null,
  message = ERROR_MESSAGES.LOADING.DATA,
  errorMessage = ERROR_MESSAGES.DATA.LOADING_FAILED,
  fadeDuration = 7000,
  onRetry,
  variant = 'spinner',
  showOverlay = false,
  spinnerClassName = '',
  isFading: externalFading,
}) => {
  const { isVisible, isFading: internalFading } = useLoadingState(isLoading, isLoaded, fadeDuration);
  const isFading = externalFading !== undefined ? externalFading : internalFading;

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.loadingFallback} ${isFading ? styles.fading : ''} ${showOverlay ? styles.overlay : ''}`}
      style={isFading ? { animationDuration: `${fadeDuration}ms` } : undefined}
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
    >
      <div className={styles.loadingContent}>
        {!error ? (
          <LoadingVariant variant={variant} message={message} spinnerClassName={spinnerClassName} />
        ) : (
          <ErrorDisplay message={errorMessage || error.message} onRetry={onRetry} />
        )}
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';

export const MemoizedLoadingFallback = memo(LoadingFallback);
export { LoadingFallback };
export default memo(LoadingFallback);
