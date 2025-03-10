import React from 'react';

interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  label,
  htmlFor,
  required = false,
  error,
  helpText,
  className = '',
}) => {
  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="form-group-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div className="form-group-field">{children}</div>
      {helpText && <div className="form-group-help">{helpText}</div>}
      {error && <div className="form-group-error">{error}</div>}
    </div>
  );
};
