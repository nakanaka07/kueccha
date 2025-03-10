import { ReactNode } from 'react';
import { BaseProps } from './common';

export interface ModalBaseProps extends BaseProps {
  onClose: () => void;
}

export interface LoadingFallbackProps extends BaseProps {
  isLoading?: boolean;
  isLoaded?: boolean;
  message?: string;
  spinnerClassName?: string;
  fadeDuration?: number;
  variant?: 'spinner' | 'skeleton' | 'progress';
  isFading?: boolean;
}

export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: {
    componentStack: string;
  } | null;
}

export interface MenuItem {
  label: string;
  title: string;
  action: string;
}
