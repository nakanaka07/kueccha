import React, { Component, ErrorInfo } from 'react';
import type { ErrorBoundaryProps } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants/messages';

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <div>
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
