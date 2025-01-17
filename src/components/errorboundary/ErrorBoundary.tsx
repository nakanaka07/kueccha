import React, { Component, ErrorInfo } from 'react'; // Reactと必要な型をインポート
import type { ErrorBoundaryProps } from '../../utils/types'; // 型定義をインポート
import { ERROR_MESSAGES } from '../../utils/constants'; // エラーメッセージをインポート
import './ErrorBoundary.css'; // スタイルをインポート

// コンポーネントの状態の型定義
interface State {
  hasError: boolean; // エラーが発生したかどうか
  error?: Error; // 発生したエラー
  errorInfo?: ErrorInfo; // エラーの詳細情報
}

// ErrorBoundaryコンポーネントの定義
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  // 初期状態の設定
  state: State = {
    hasError: false, // 初期状態ではエラーは発生していない
  };

  // エラーが発生したときに状態を更新する静的メソッド
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }; // エラーが発生したことを状態に反映
  }

  // エラーがキャッチされたときに呼び出されるメソッド
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo }); // エラーの詳細情報を状態に設定
  }

  // エラー状態をリセットするメソッド
  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined }); // エラー状態をリセット
  };

  // レンダリングメソッド
  render() {
    // エラーが発生している場合の表示
    if (this.state.hasError) {
      return (
        this.props.fallback || ( // フォールバックUIが提供されている場合はそれを表示
          <div className="error-boundary" role="alert" aria-live="assertive">
            <div className="error-content">
              <h1>{ERROR_MESSAGES.SYSTEM.UNKNOWN}</h1>
              <p>
                {this.state.error?.message || ERROR_MESSAGES.SYSTEM.UNKNOWN}
              </p>
              <button onClick={this.handleReset}>再試行</button>
            </div>
          </div>
        )
      );
    }

    // エラーが発生していない場合は子コンポーネントを表示
    return this.props.children;
  }
}
