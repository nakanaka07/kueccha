// ErrorDisplay.tsx
import React from 'react';
import styles from './LoadingFallback.module.css';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: R
eact.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon} aria-hidden="true" />
      <p>{message}</p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          再試行
        </button>
      )}
    </div>
  );
};