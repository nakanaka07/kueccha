export interface AppError {
  message: string;
  code?: string;
  details?: string;
  category?: string;
  severity?: 'critical' | 'warning' | 'info';
}

// ErrorBoundaryStateを拡張型として定義
export interface ErrorBoundaryState {
  hasError: boolean;
  appError: AppError | null;
  componentStack?: string;
}
