import React, { memo } from 'react';
import styles from './LoadingFallback.module.css';
import { SkeletonLoader } from './SkeletonLoader';
import { Spinner } from './Spinner';
import { ERROR_MESSAGES } from '../../constants/messages';
import { useLoadingState } from '../../hooks/useLoadingState';

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
          <>
            {variant === 'spinner' && (
              <>
                <Spinner size="large" className={`${styles.spinnerMargin} ${spinnerClassName}`} />
                <p>{message}</p>
              </>
            )}
            {variant === 'skeleton' && (
              <div className={styles.skeletonContainer}>
                <SkeletonLoader type="rectangle" width="100%" height="20px" count={3} />
              </div>
            )}
            {variant === 'progress' && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div className={styles.progressIndicator} />
                </div>
                <p>{message}</p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon} aria-hidden="true" />
            <p>{errorMessage || error.message}</p>
            {onRetry && (
              <button className={styles.retryButton} onClick={onRetry}>
                再試行
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';

export const MemoizedLoadingFallback = memo(LoadingFallback);
export { LoadingFallback };
export default memo(LoadingFallback);
