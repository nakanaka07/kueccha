import React from 'react';

export interface SkeletonLoaderProps {
  type: 'rectangle' | 'circle' | 'text';
  width?: string;
  height?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 1 }) => {
  const items = Array(count)
    .fill(0)
    .map((_, index) => <div key={index} aria-hidden="true" />);

  return <>{items}</>;
};

export default SkeletonLoader;
