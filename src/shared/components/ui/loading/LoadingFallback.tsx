import React, { memo } from 'react';
import { LoadingVariant } from './LoadingVariants';
import { LOADING_MESSAGES, ERRORS } from '../../../../core/constants/messages';
import { useLoadingState } from '../../../../core/hooks/useLoadingState';
import { ErrorDisplay } from '../error/ErrorDisplay';

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
  message = LOADING_MESSAGES.data,
  errorMessage = ERRORS.dataLoading,
  fadeDuration = 7000,
  onRetry,
  variant = 'spinner',
}) => {
  const { isVisible } = useLoadingState(isLoading, isLoaded, fadeDuration);

  if (!isVisible) return null;

  return (
    <div role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'}>
      <div>
        {!error ? (
          <LoadingVariant variant={variant} message={message} />
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
