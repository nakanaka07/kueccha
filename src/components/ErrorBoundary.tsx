import React, { Component, ErrorInfo, ReactNode } from 'react';

import ErrorDisplay from './ErrorDisplay';

import { logger } from '@/utils/logger';

/**
 * エラーバウンダリーのプロパティ定義
 */
interface ErrorBoundaryProps {
  /**
   * 子コンポーネント
   */
  children: ReactNode;

  /**
   * カスタムフォールバックコンポーネント（オプション）
   * 指定されない場合はデフォルトのErrorDisplayを使用
   */
  fallback?: ReactNode;

  /**
   * エラー発生時のコールバック関数（オプション）
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * エラーメッセージの接頭辞（オプション）
   * @default "コンポーネントでエラーが発生しました"
   */
  messagePrefix?: string;
}

/**
 * エラーバウンダリーの状態定義
 */
interface ErrorBoundaryState {
  /**
   * エラーが発生したかどうか
   */
  hasError: boolean;

  /**
   * 発生したエラー
   */
  error: Error | null;
}

/**
 * アプリケーション全体のエラーを捕捉するエラーバウンダリーコンポーネント
 *
 * - KISS原則に基づいたシンプルな実装
 * - エラー時のフォールバックUIを提供
 * - エラーログを記録
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error) => trackError('app-crash', error)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * エラー発生時の状態更新
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 次のレンダリングでフォールバックUIを表示するために状態を更新
    return {
      hasError: true,
      error,
    };
  }

  /**
   * エラー発生時のログ記録とコールバック実行
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラー情報をログに記録
    logger.error('React コンポーネントでエラーが捕捉されました', {
      component: 'ErrorBoundary',
      action: 'component_error',
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // コールバックが提供されている場合は実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * コンポーネントレンダリング
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // カスタムフォールバックが指定されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // エラーメッセージを構築
      const messagePrefix = this.props.messagePrefix || 'コンポーネントでエラーが発生しました';
      const errorMessage = this.state.error
        ? `${messagePrefix}: ${this.state.error.message}`
        : `${messagePrefix}。詳細は不明です。`;

      // デフォルトのエラー表示を使用
      return (
        <ErrorDisplay
          message={errorMessage}
          title='アプリケーションエラー'
          reloadButtonText='アプリを再読み込み'
        />
      );
    }

    // エラーがない場合は子要素を表示
    return this.props.children;
  }
}

export default ErrorBoundary;
