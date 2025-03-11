import React, { Component, ErrorInfo } from 'react';
import { ErrorDisplay } from './ErrorDisplay';
import { ERRORS } from './messages';
import { useErrorState } from '../../../../core/hooks/useErrorHandling';
import { createError, formatErrorDetails, isRetryableError } from '../../../../core/utils/errorHandling';
import type { AppError } from './common';
import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  appError: AppError | null;
  componentStack?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    appError: null,
    componentStack: undefined,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラーを標準化されたAppError型に変換
    const appError = createError('SYSTEM', 'RENDER_ERROR', error.message, 'REACT_ERROR_BOUNDARY');

    return {
      hasError: true,
      appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // コンポーネントスタック情報を状態に保存
    this.setState({
      componentStack: errorInfo.componentStack || '',
    });

    // エラーとスタック情報をログ出力
    console.error('ErrorBoundary caught an error', error, errorInfo);

    // カスタムエラーハンドラがあれば呼び出し
    if (this.props.onError && this.state.appError) {
      this.props.onError({
        ...this.state.appError,
        details: `${this.state.appError.details || ''}\n${errorInfo.componentStack || ''}`,
      });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      appError: null,
      componentStack: undefined,
    });
  };

  private renderErrorMessage() {
    const { appError, componentStack } = this.state;
    const { fallback } = this.props;

    if (fallback) {
      return fallback;
    }

    // 既存のErrorDisplayコンポーネントを使用
    return (
      <ErrorDisplay
        error={appError}
        message={appError?.message || ERRORS.errorBoundary.unknownError}
        details={formatErrorDetails({
          ...appError,
          details: componentStack ? `${appError?.details || ''}\n${componentStack}` : appError?.details,
        })}
        onRetry={isRetryableError(appError) ? this.handleReset : undefined}
      />
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorMessage();
    }

    return this.props.children;
  }
}

// ラッパーコンポーネントを作成
export const FunctionalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  // プロパティの不一致を解消するため、明示的に分割代入を使用
  const { error, setError } = useErrorState();

  return <ErrorBoundary onError={setError}>{children}</ErrorBoundary>;
};

export default ErrorBoundary;
