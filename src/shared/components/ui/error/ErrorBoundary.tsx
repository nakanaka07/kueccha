import React, { Component, ErrorInfo } from 'react';
import { ERRORS } from '../../../../core/constants/messages';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../../../../core/types/ui';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo: { componentStack: errorInfo.componentStack || '' },
    });

    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private renderErrorMessage() {
    const { error } = this.state;
    const { fallback } = this.props;

    if (fallback) {
      return fallback;
    }

    return (
      <div role="alert" aria-live="assertive">
        <div>
          <h1>{ERRORS.errorBoundary.unknownError}</h1>
          <p>{error?.message || ERRORS.errorBoundary.unknownError}</p>
          <p>問題が解決しない場合は、サポートにお問い合わせください。</p>
          <button onClick={this.handleReset} aria-label={ERRORS.errorBoundary.retryButton}>
            {ERRORS.errorBoundary.retryButton}
          </button>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorMessage();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
