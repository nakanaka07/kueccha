import { Component, ErrorInfo, ReactNode } from 'react';

import ErrorDisplay from './ErrorDisplay';

import { getEnvVar } from '@/env';
import { logger } from '@/utils/logger';

// 静的ホスティング環境であるかの判断
const isStaticHosted = (): boolean => {
  return (
    getEnvVar({ key: 'VITE_STATIC_HOSTING', defaultValue: 'false' }) === 'true' ||
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('netlify.app')
  );
};

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
   *
   * - ReactNode型：静的なフォールバックUIを提供
   * - 関数型：エラー情報を受け取り動的なフォールバックUIを生成
   *
   * @example
   * ```tsx
   * // 静的フォールバック
   * <ErrorBoundary fallback={<CustomError />}>
   *   <MyComponent />
   * </ErrorBoundary>
   *
   * // 動的フォールバック
   * <ErrorBoundary fallback={(error) => <CustomError message={error.message} />}>
   *   <MyComponent />
   * </ErrorBoundary>
   * ```
   */
  fallback?: ReactNode | ((error: Error) => ReactNode);

  /**
   * エラー発生時のコールバック関数（オプション）
   * エラー情報を外部システムに報告するなどの処理に使用
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * エラーメッセージの接頭辞（オプション）
   * デフォルトのErrorDisplayコンポーネントを使用する場合のメッセージ設定
   * @default "コンポーネントでエラーが発生しました"
   */
  messagePrefix?: string;

  /**
   * エラー発生時のロギングレベル（オプション）
   * @default "error"
   */
  logLevel?: 'error' | 'warn' | 'info';

  /**
   * コンポーネント名（オプション）
   * エラーログに記録するコンポーネント名
   * @default "ErrorBoundary"
   */
  componentName?: string;
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
 * - 柔軟なフォールバックUIのカスタマイズをサポート
 * - パフォーマンスメトリクス収集によるエラー診断強化
 *
 * @example
 * ```tsx
 * // 基本的な使用法
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * // エラーコールバック付き
 * <ErrorBoundary onError={(error) => trackError('app-crash', error)}>
 *   <App />
 * </ErrorBoundary>
 *
 * // カスタムフォールバックUI付き
 * <ErrorBoundary fallback={(error) => <CustomErrorView message={error.message} />}>
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
   * 次のレンダリングでフォールバックUIを表示するための準備
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }
  /**
   * エラー発生時のログ記録とコールバック実行
   * エラー情報の構造化ロギングとカスタムエラーハンドリングを実装
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // プロパティからロギング設定を取得（デフォルト値を使用）
    const { componentName = 'ErrorBoundary', logLevel = 'error', onError } = this.props;

    // 静的ホスティング環境かどうかをチェック
    const isStatic = isStaticHosted();

    // エラー情報の詳細を収集
    const errorDetails = {
      component: componentName,
      action: 'component_error',
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      // パフォーマンス情報（静的ホスティング環境では最小限のみ収集）
      performanceMetrics: isStatic ? this.getMinimalMetrics() : this.getPerformanceMetrics(),
      url: window.location.href,
      isStaticHosting: isStatic,
    };

    // 設定されたログレベルでエラーをロギング
    switch (logLevel) {
      case 'warn':
        logger.warn('React コンポーネントで警告が捕捉されました', errorDetails);
        break;
      case 'info':
        logger.info('React コンポーネントで情報が捕捉されました', errorDetails);
        break;
      case 'error':
      default:
        logger.error('React コンポーネントでエラーが捕捉されました', errorDetails);
        break;
    }

    // コールバックが提供されている場合は実行
    if (onError) {
      onError(error, errorInfo);
    }
  }

  /**
   * 静的ホスティング環境向けの最小限のパフォーマンスメトリクスを収集
   */
  private getMinimalMetrics(): Record<string, unknown> {
    try {
      const metrics: Record<string, unknown> = {};
      if (window.performance && performance.now) {
        metrics.timeSincePageLoad = performance.now();
      }
      return metrics;
    } catch {
      return { error: 'メトリクス収集に失敗しました' };
    }
  }

  /**
   * パフォーマンスメトリクスを収集
   * ブラウザ環境によって利用可能なメトリクスが異なるため、安全に取得
   */ private getPerformanceMetrics(): Record<string, unknown> {
    try {
      const metrics: Record<string, unknown> = {};

      // Navigation Timing API
      if (window.performance) {
        if (performance.now) {
          metrics.timeSincePageLoad = performance.now();
        }

        if (performance.getEntriesByType) {
          const navEntries = performance.getEntriesByType('navigation');
          if (navEntries && navEntries.length > 0) {
            const navTiming = navEntries[0] as PerformanceNavigationTiming;
            metrics.navigation = {
              domComplete: navTiming.domComplete,
              loadEventEnd: navTiming.loadEventEnd,
              type: navTiming.type,
            };
          }

          // リソースのタイミング情報
          const resourceEntries = performance.getEntriesByType('resource');
          if (resourceEntries && resourceEntries.length > 0) {
            metrics.resourceCount = resourceEntries.length;
          }
        }
      }

      return metrics;
    } catch (errorObj) {
      // パフォーマンスメトリクス収集中のエラーは無視
      // (エラーハンドリング自体に失敗しないようにするため)
      return {
        error: 'パフォーマンスメトリクスの収集に失敗しました',
        errorMessage: errorObj instanceof Error ? errorObj.message : '不明なエラー',
      };
    }
  }

  /**
   * エラー状態をリセットする
   * エラー後の再試行に使用できるパブリックメソッド
   */
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };
  /**
   * コンポーネントレンダリング
   * エラー状態に応じたUIの条件付きレンダリング
   */
  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { fallback, messagePrefix, children } = this.props;

    if (hasError) {
      // フォールバックUIの決定
      if (fallback) {
        // 関数型フォールバックの場合
        if (typeof fallback === 'function' && error) {
          // 関数型フォールバックには明示的にエラーを渡す
          return fallback(error) as ReactNode;
        }
        // ReactNode型フォールバックの場合（静的なフォールバックUI）
        return fallback as ReactNode;
      }

      // デフォルトのエラー表示を使用
      const prefix = messagePrefix || 'コンポーネントでエラーが発生しました';
      const errorMessage = error ? `${prefix}: ${error.message}` : `${prefix}。詳細は不明です。`;

      return (
        <ErrorDisplay
          message={errorMessage}
          title='アプリケーションエラー'
          reloadButtonText='アプリを再読み込み'
          onError={() => {
            // ページ再読み込みによるリカバリー
            window.location.reload();
          }}
        />
      );
    }

    // エラーがない場合は子要素を表示
    return children;
  }
}

export default ErrorBoundary;
