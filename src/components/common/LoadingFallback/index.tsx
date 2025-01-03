import React from 'react';
import type { LoadingFallbackProps } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants/messages';

const LoadingFallback = ({ isLoading }: LoadingFallbackProps) => {
  if (!isLoading) return null;

  return (
    <div>
      <div>
        <div />
        <p>{ERROR_MESSAGES.LOADING.DATA}</p>
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';

export { LoadingFallback };
export default LoadingFallback;
