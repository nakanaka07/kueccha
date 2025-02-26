/**
 * ErrorBoundary.tsx
 *
 * このファイルはReactアプリケーションでのエラーハンドリングを担当するErrorBoundaryコンポーネントを定義します。
 * ErrorBoundaryは子コンポーネントツリー内で発生したJavaScriptエラーをキャッチし、
 * クラッシュしたコンポーネントツリーの代わりにフォールバックUIを表示します。
 * これにより、アプリケーション全体がクラッシュすることを防ぎます。
 */

// ReactのComponentクラスとErrorInfo型をインポート - エラーバウンダリーはクラスコンポーネントとして実装する必要がある
import React, { Component, ErrorInfo } from 'react';
// コンポーネントのスタイルを定義するCSSファイルをインポート
import './ErrorBoundary-module.css';
// アプリケーション内で使用される標準エラーメッセージを含む定数をインポート
import { ERROR_MESSAGES } from '../../utils/constants';
// エラーバウンダリーコンポーネントのプロパティと状態の型定義をインポート
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../../utils/types';

/**
 * ErrorBoundaryコンポーネント
 *
 * 子コンポーネントで発生した予期しないエラーをキャッチし、
 * ユーザーに適切なフィードバックを提供するためのコンポーネントです。
 * React 16以降で導入されたエラーバウンダリーの機能を実装しています。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * コンポーネントの初期状態を設定
   * hasError: エラーが発生したかどうかのフラグ（初期値: false）
   * error: 発生したエラーオブジェクト（初期値: null）
   * errorInfo: エラーに関する詳細情報、主にスタックトレース（初期値: null）
   */
  state: ErrorBoundaryState = {
    hasError: false, // エラーが発生していない状態からスタート
    error: null, // エラーオブジェクトは初期状態ではnull
    errorInfo: null, // エラー情報も初期状態ではnull
  };

  /**
   * 静的ライフサイクルメソッド: getDerivedStateFromError
   *
   * 子コンポーネントでエラーが発生した時に呼び出されます。
   * 発生したエラーに基づいて新しい状態を返し、次のレンダリングでフォールバックUIを表示します。
   * このメソッドはレンダリングフェーズで呼び出されるため、副作用を含めてはいけません。
   *
   * @param error - 発生したエラーオブジェクト
   * @returns エラー状態を示す新しいstate
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // エラーが発生したことを示す状態を返す
    return {
      hasError: true, // エラーが発生したことをフラグで示す
      error, // 発生したエラーオブジェクトを保存
      errorInfo: null, // この時点ではまだエラー情報は利用できない（componentDidCatchで設定される）
    };
  }

  /**
   * ライフサイクルメソッド: componentDidCatch
   *
   * 子コンポーネントでエラーがスローされた後のコミットフェーズで呼び出されます。
   * エラーの詳細情報をstateに保存し、必要に応じてエラーログ送信などの副作用を実行できます。
   *
   * @param error - 発生したエラーオブジェクト
   * @param errorInfo - コンポーネントスタックなどの追加情報を含むオブジェクト
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーの詳細情報をstateに保存
    this.setState({
      errorInfo: { componentStack: errorInfo.componentStack || '' }, // コンポーネントのスタックトレースを保存（空文字列をフォールバックとして使用）
    });

    // ここにエラーログの送信などの処理を追加することも可能
  }

  /**
   * エラー状態をリセットするハンドラメソッド
   *
   * ユーザーが「再試行」ボタンをクリックした時などに呼び出され、
   * コンポーネントの状態をリセットして再レンダリングを試みます。
   */
  private handleReset = () => {
    // stateを初期状態に戻す
    this.setState({
      hasError: false, // エラー状態を解除
      error: null, // エラーオブジェクトをクリア
      errorInfo: null, // エラー情報をクリア
    });
    // stateがリセットされることで、次のレンダリングで通常のコンポーネントを表示する
  };

  /**
   * エラーメッセージをレンダリングするプライベートメソッド
   *
   * エラー発生時にユーザーに表示するエラーメッセージUIを構築します。
   * カスタムフォールバックがpropsで提供されている場合はそれを使用し、
   * そうでない場合はデフォルトのエラー表示を生成します。
   *
   * @returns フォールバックUI用のJSX要素
   */
  private renderErrorMessage() {
    const { error } = this.state; // 現在のエラーオブジェクトを取得
    const { fallback } = this.props; // カスタムフォールバックUIがあれば取得

    // カスタムフォールバックUIが指定されている場合はそれを優先して表示
    if (fallback) {
      return fallback;
    }

    // カスタムフォールバックがない場合はデフォルトのエラーメッセージUIを表示
    return (
      <div className="error-boundary" role="alert" aria-live="assertive">
        {/* エラーメッセージを含むコンテンツコンテナ */}
        <div className="error-content">
          {/* エラーのタイトル - 不明なエラーのメッセージを表示 */}
          <h1>{ERROR_MESSAGES.SYSTEM.UNKNOWN}</h1>
          {/* エラーの詳細メッセージ（存在する場合）または汎用メッセージを表示 */}
          <p>{error?.message || ERROR_MESSAGES.SYSTEM.UNKNOWN}</p>
          {/* ユーザーへの追加情報 */}
          <p>問題が解決しない場合は、サポートにお問い合わせください。</p>
          {/* 再試行ボタン - クリックするとhandleResetが呼び出される */}
          <button onClick={this.handleReset} aria-label={ERROR_MESSAGES.ERROR_BOUNDARY.RETRY_BUTTON}>
            {ERROR_MESSAGES.ERROR_BOUNDARY.RETRY_BUTTON}
          </button>
        </div>
      </div>
    );
  }

  /**
   * レンダリングメソッド
   *
   * エラーが発生している場合はエラーメッセージを表示し、
   * エラーがない場合は通常の子コンポーネントをレンダリングします。
   *
   * @returns レンダリングするJSX要素
   */
  render() {
    // エラーが発生している場合
    if (this.state.hasError) {
      // エラーメッセージUIをレンダリング
      return this.renderErrorMessage();
    }

    // エラーがない場合は子コンポーネントをそのまま表示
    return this.props.children;
  }
}

// デフォルトエクスポートとしてErrorBoundaryコンポーネントをエクスポート
export default ErrorBoundary;
