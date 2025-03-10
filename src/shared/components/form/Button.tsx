import React from 'react';

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  children,
}) => {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
