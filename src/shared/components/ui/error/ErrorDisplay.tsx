import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div>
      <div aria-hidden="true" />
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>再試行</button>}
    </div>
  );
};
