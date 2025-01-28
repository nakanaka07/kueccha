import React, { Component, ErrorInfo } from 'react';
import type { ErrorBoundaryProps } from '../../utils/types';
import { ERROR_MESSAGES } from '../../utils/constants';
import './ErrorBoundary.css';

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary" role="alert" aria-live="assertive">
            <div className="error-content">
              <h1>{ERROR_MESSAGES.SYSTEM.UNKNOWN}</h1>
              <p>{this.state.error?.message || ERROR_MESSAGES.SYSTEM.UNKNOWN}</p>
              <button onClick={this.handleReset}>再試行</button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
