import React from 'react';

interface SpinnerViewProps {
  size: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  label: string;
  isFading: boolean;
}

export const SpinnerView: React.FC<SpinnerViewProps> = ({ label }) => {
  return (
    <div aria-hidden="true" role="presentation" data-testid="spinner">
      <span>{label}</span>
    </div>
  );
};
