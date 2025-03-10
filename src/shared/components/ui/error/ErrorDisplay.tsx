import React from 'react';
import type { AppError } from '../../../../core/types/common';

interface ErrorDisplayProps {
  error?: AppError | null;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, message, onRetry, className }) => {
  const displayMessage = message || error?.message || '予期せぬエラーが発生しました。';
  const isRetryable = error?.severity !== 'critical';

  return (
    <div className={`errorDisplay ${error?.severity || ''} ${className || ''}`} role="alert" aria-live="assertive">
      <div className="errorContainer">
        <p className="errorMessage">{displayMessage}</p>
        {error?.details && <p className="errorDetails">{error.details}</p>}
        {onRetry && isRetryable && (
          <button onClick={onRetry} className="retryButton">
            再試行
          </button>
        )}
      </div>
    </div>
  );
};
