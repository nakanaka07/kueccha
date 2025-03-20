import React, { Component, ErrorInfo } from 'react';
import { ERROR_MESSAGES } from '../constants';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../types/types';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo: { componentStack: errorInfo.componentStack || '' } });
    console.error('エラーが発生しました', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (!hasError) return children;

    if (fallback) return fallback;

    return (
      <div role="alert" aria-live="assertive">
        <h1>{ERROR_MESSAGES.SYSTEM.UNKNOWN}</h1>
        <p>{error?.message || ERROR_MESSAGES.SYSTEM.UNKNOWN}</p>
        <p>問題が解決しない場合は、サポートにお問い合わせください。</p>
        <button
          onClick={this.handleReset}
          aria-label={ERROR_MESSAGES.ERROR_BOUNDARY.RETRY_BUTTON}
        >
          {ERROR_MESSAGES.ERROR_BOUNDARY.RETRY_BUTTON}
        </button>
      </div>
    );
  }
}