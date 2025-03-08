/*
 * 機能: Reactコンポーネントツリー内でのエラーをキャッチし、フォールバックUIを表示するエラーバウンダリー
 * 依存関係:
 *   - React
 *   - ErrorBoundary.module.cssスタイルシート
 *   - ERROR_MESSAGESオブジェクト
 *   - ErrorBoundaryProps, ErrorBoundaryState型定義
 * 注意点:
 *   - このコンポーネントはレンダリングフェーズのエラーのみをキャッチします
 *   - イベントハンドラ内のエラーはキャッチされません
 *   - フォールバックUIをカスタマイズするにはfallbackプロパティを使用します
 */
import React, { Component, ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';
import { ERROR_MESSAGES } from '../constants/messages';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../../types/ui';

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
      <div className={styles.errorBoundary} role="alert" aria-live="assertive">
        <div className={styles.errorContent}>
          <h1>{ERROR_MESSAGES.SYSTEM.UNKNOWN}</h1>
          <p>{error?.message || ERROR_MESSAGES.SYSTEM.UNKNOWN}</p>
          <p>問題が解決しない場合は、サポートにお問い合わせください。</p>
          <button onClick={this.handleReset} aria-label={ERROR_MESSAGES.ERROR_BOUNDARY.RETRY_BUTTON}>
            {ERROR_MESSAGES.ERROR_BOUNDARY.RETRY_BUTTON}
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
