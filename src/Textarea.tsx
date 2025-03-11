import React from 'react';

interface TextareaProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  className?: string;
  error?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export const Textarea: React.FC<TextareaProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = '',
  label,
  required = false,
  disabled = false,
  rows = 3,
  className = '',
  error,
  resize = 'vertical',
}) => {
  const textareaId = id || name;
  const style = {
    resize: resize as React.CSSProperties['resize'],
  };

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        style={style}
        className={`form-textarea ${error ? 'textarea-error' : ''} ${className}`}
        aria-invalid={!!error}
      />
      {error && <div className="textarea-error-message">{error}</div>}
    </div>
  );
};
