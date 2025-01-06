import React, { Component, ErrorInfo } from 'react';
import type { ErrorBoundaryProps } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';
import '../../../App.css'; // スタイルシートをインポート

// Stateインターフェースの定義
interface State {
  hasError: boolean; // エラーが発生したかどうかを示すフラグ
  error?: Error; // 発生したエラーのオブジェクト
  errorInfo?: ErrorInfo; // エラーに関する追加情報
}

// ErrorBoundaryコンポーネントの定義
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  // 初期状態の設定
  state: State = {
    hasError: false,
  };

  // エラーが発生したときに状態を更新する静的メソッド
  static getDerivedStateFromError(error: Error): State {
    // エラーが発生したことを示すフラグを設定し、エラーオブジェクトを保存
    return { hasError: true, error };
  }

  // エラーがキャッチされたときに呼び出されるライフサイクルメソッド
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー情報を状態に保存
    this.setState({ errorInfo });
  }

  // エラー状態をリセットするためのハンドラ
  private handleReset = () => {
    // エラー状態を初期化
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  // レンダリングメソッド
  render() {
    // エラーが発生している場合の表示
    if (this.state.hasError) {
      return (
        // フォールバックUIが提供されている場合はそれを表示
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

    // エラーが発生していない場合は子コンポーネントを表示
    return this.props.children;
  }
}
