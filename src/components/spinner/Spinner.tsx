import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color,
  className = '',
  label = 'ローディング中',
}) => {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className}`}
      style={color ? { borderTopColor: color } : undefined}
      aria-hidden="true"
      role="presentation"
    >
      <span className={styles.visuallyHidden}>{label}</span>
    </div>
  );
};

export default Spinner;
