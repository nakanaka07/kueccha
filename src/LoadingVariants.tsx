import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { Spinner } from './Spinner';

interface LoadingVariantProps {
  variant: 'spinner' | 'skeleton' | 'progress';
  message: string;
  spinnerClassName?: string;
}

export const LoadingVariant: React.FC<LoadingVariantProps> = ({ variant, message }) => {
  if (variant === 'spinner') {
    return (
      <>
        <Spinner size="large" />
        <p>{message}</p>
      </>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div>
        <SkeletonLoader type="rectangle" width="100%" height="20px" count={3} />
      </div>
    );
  }

  if (variant === 'progress') {
    return (
      <div>
        <div>
          <div />
        </div>
        <p>{message}</p>
      </div>
    );
  }

  return null;
};
