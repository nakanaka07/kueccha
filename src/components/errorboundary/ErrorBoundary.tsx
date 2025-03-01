/**
 * ErrorBoundary.tsx
 *
 * @description
 * Reactアプリケーション内でのエラーハンドリングを担当するコンポーネント。
 * 子コンポーネントツリー内で発生したJavaScriptエラーをキャッチし、
 * クラッシュしたコンポーネントツリーの代わりにフォールバックUIを表示します。
 * これにより、アプリケーション全体がクラッシュすることを防ぎます。
 *
 * @usage
 * 以下のようなケースで使用します：
 * - アプリケーション全体をラップしてグローバルなエラーハンドリングを提供
 * - 特定の機能やセクションをラップして部分的なエラー分離を実現
 * - 外部APIとの連携など、エラーが発生しやすい処理の周囲
 * - サードパーティライブラリの不安定な部分を分離
 * - 実験的な機能やベータ版の機能
 *
 * @features
 * - 宣言的なエラーハンドリング（try/catchの代替）
 * - カスタマイズ可能なフォールバックUI
 * - エラー状態のリセット機能（再試行ボタン）
 * - エラー詳細情報の収集（デバッグやログ用）
 * - スタックトレースの保存
 * - アクセシビリティに配慮した実装（ARIA属性）
 *
 * @props
 * - children: ReactNode - エラーバウンダリーでラップする子コンポーネント
 * - fallback?: ReactNode - エラー発生時に表示するカスタムUI（省略時はデフォルトUI）
 *
 * @example
 * // アプリケーション全体をラップする基本的な使用例
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * // カスタムフォールバックUIを使用した例
 * <ErrorBoundary fallback={<div>エラーが発生しました。<button>リロード</button></div>}>
 *   <DataFetchingComponent />
 * </ErrorBoundary>
 *
 * // 複数のコンポーネントを分離してエラーハンドリングする例
 * <div>
 *   <ErrorBoundary>
 *     <ComponentA />
 *   </ErrorBoundary>
 *   <ErrorBoundary>
 *     <ComponentB />
 *   </ErrorBoundary>
 * </div>
 *
 * @bestPractices
 * - アプリケーションの適切なレベルでErrorBoundaryを使用（粒度を検討）
 * - エラーメッセージは明確でユーザーフレンドリーなものにする
 * - 可能な限りユーザーに回復のための選択肢を提供する
 * - 開発環境ではエラー詳細を表示し、本番環境では一般的なメッセージを表示する
 * - エラー情報は監視システムに送信して問題追跡に役立てる
 *
 * @dependencies
 * - React: ComponentクラスとErrorInfo型を使用
 * - ErrorBoundary.module.css: スタイリングを提供
 * - ERROR_MESSAGES: 標準化されたエラーメッセージ定数
 * - ErrorBoundaryProps/ErrorBoundaryState: 型定義
 */

import React, { Component, ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';
import { ERROR_MESSAGES } from '../../utils/constants';
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
    console.error('ErrorBoundary caught an error', error, errorInfo);
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
      <div className={styles.errorBoundary} role="alert" aria-live="assertive">
        {/* エラーメッセージを含むコンテンツコンテナ */}
        <div className={styles.errorContent}>
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
