// ReactのComponentとErrorInfoをインポート
import React, { Component, ErrorInfo } from 'react';
// CSSファイルをインポート
import './ErrorBoundary.css';
// 定数をインポート
import { ERROR_MESSAGES } from '../../utils/constants';
// エラーログ送信用の関数をインポート
import { sendErrorLog } from '../../utils/logger';
// 型定義をインポート
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../../utils/types';

// ErrorBoundaryコンポーネントを定義
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // 初期状態を設定
  state: ErrorBoundaryState = {
    hasError: false, // エラーが発生したかどうかを示すフラグ
    error: null, // 発生したエラーオブジェクト
    errorInfo: null, // エラーに関する追加情報
  };

  // エラーが発生したときに状態を更新する静的メソッド
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // エラーが発生したことを示す状態を返す
    return {
      hasError: true, // エラーが発生したことを設定
      error, // 発生したエラーオブジェクトを設定
      errorInfo: null, // エラー情報を初期化
    };
  }

  // エラーがキャッチされたときに呼ばれるメソッド
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラー情報を状態に設定
    this.setState({
      errorInfo: { componentStack: errorInfo.componentStack || '' }, // エラーのスタックトレースを設定
    });
    // エラーをログに出力
    this.logError(error, errorInfo);
  }

  // エラーをログに出力するプライベートメソッド
  private logError(error: Error, errorInfo: ErrorInfo) {
    // エラーログをサーバーに送信
    sendErrorLog(error, errorInfo);
  }

  // エラー状態をリセットするハンドラ
  private handleReset = () => {
    // エラー状態をリセット
    this.setState({
      hasError: false, // エラー状態をリセット
      error: null, // エラーオブジェクトをリセット
      errorInfo: null, // エラー情報をリセット
    });
  };

  // エラーメッセージをレンダリングするメソッド
  private renderErrorMessage() {
    const { error } = this.state; // 状態からエラーを取得
    const { fallback } = this.props; // プロパティからフォールバックを取得

    // フォールバックが指定されている場合はそれを表示
    if (fallback) {
      return fallback;
    }

    // デフォルトのエラーメッセージを表示
    return (
      <div className="error-boundary" role="alert" aria-live="assertive">
        <div className="error-content">
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

  // レンダリングメソッド
  render() {
    // エラーが発生している場合はエラーメッセージを表示
    if (this.state.hasError) {
      return this.renderErrorMessage();
    }

    // エラーが発生していない場合は子コンポーネントを表示
    return this.props.children;
  }
}

// コンポーネントをエクスポート
export default ErrorBoundary;
