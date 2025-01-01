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
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white rounded-lg shadow-lg">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                {ERROR_MESSAGES.SYSTEM.UNKNOWN}
              </h1>
              <p className="text-gray-700 mb-4">
                {this.state.error?.message || ERROR_MESSAGES.SYSTEM.UNKNOWN}
              </p>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                再試行
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
