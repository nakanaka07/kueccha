export interface AppError {
  message: string;
  code?: string;
  details?: string;
  category?: string;
  severity?: 'critical' | 'warning' | 'info';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  appError: AppError | null;
  componentStack?: string;
}

export interface GeolocationError {
  code: number;
  message: string;
  details?: string;
}
