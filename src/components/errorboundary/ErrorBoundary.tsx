import React, { Component, ErrorInfo } from 'react'; // Reactと必要なクラスをインポート
import type { ErrorBoundaryProps } from '../../utils/types'; // ErrorBoundaryProps型をインポート
import { ERROR_MESSAGES } from '../../utils/constants'; // エラーメッセージ定数をインポート
import './ErrorBoundary.css'; // スタイルシートをインポート

interface State {
  hasError: boolean; // エラーが発生したかどうかを示すフラグ
  error?: Error; // 発生したエラー
  errorInfo?: ErrorInfo; // エラー情報
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = {
    hasError: false, // 初期状態ではエラーは発生していない
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }; // エラーが発生した場合に状態を更新
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo }); // エラー情報を状態に設定
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined }); // エラー状態をリセット
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary" role="alert" aria-live="assertive">
            <div className="error-content">
              <h1>{ERROR_MESSAGES.SYSTEM.UNKNOWN}</h1>{' '}
              {/* エラーメッセージを表示 */}
              <p>
                {this.state.error?.message || ERROR_MESSAGES.SYSTEM.UNKNOWN}
              </p>{' '}
              {/* エラー詳細を表示 */}
              <button onClick={this.handleReset}>再試行</button>{' '}
              {/* 再試行ボタン */}
            </div>
          </div>
        )
      );
    }

    return this.props.children; // エラーが発生していない場合は子要素をレンダリング
  }
}
