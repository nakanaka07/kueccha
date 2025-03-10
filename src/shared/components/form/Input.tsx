import React from 'react';

interface InputProps {
  id: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label,
  required = false,
  disabled = false,
  className = '',
  error,
}) => {
  const inputId = id || name;

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`form-input ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={!!error}
      />
      {error && <div className="input-error-message">{error}</div>}
    </div>
  );
};
