/**
 * アプリケーションのエントリーポイント
 * 
 * このファイルはReactアプリケーションの初期化を担当し、
 * 遅延ロード、エラーハンドリング、アプリケーションのレンダリングを管理します。
 */
import React, { Suspense, StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';

import { LoadingScreen } from './components/LoadingScreen';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ERROR_MESSAGES, LogLevel } from './constants/constants';
import { createError, AppError } from './utils/errors';
import { logError } from './utils/logger';

// アプリケーションコンポーネントを遅延ロード
const App = lazy(() => import('./App'));

// 環境設定
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * サスペンス付きのアプリケーションレンダリングコンポーネント
 * アプリケーションの遅延ロードとローディング状態を管理
 */
const RenderWithErrorHandling: React.FC = () => (
  <Suspense fallback={<LoadingScreen message="アプリを読み込み中..." />}>
    <App />
  </Suspense>
);

/**
 * 致命的なエラーを処理する関数
 * Reactレンダリング外のエラーに対応し、ユーザーへの通知とリカバリーオプションを提供
 */
function handleFatalError(error: unknown): void {
  // エラー情報をログに記録
  logError('アプリケーションの初期化に失敗しました', {
    error,
    level: LogLevel.FATAL,
    context: 'application_startup'
  });
  
  // エラー表示用のDOM要素を取得
  const errorContainer = document.getElementById('app') || document.body;
  
  // アプリケーションエラーオブジェクトを作成
  const appError = createError(
    'SYSTEM',
    'INIT_FAILED',
    error instanceof Error ? error.message : '予期せぬエラーが発生しました',
    'FATAL_STARTUP_ERROR',
  );

  try {
    // Reactコンポーネントとしてエラーを表示
    const errorRoot = createRoot(errorContainer);
    errorRoot.render(
      <ErrorDisplay 
        error={appError} 
        onRetry={() => window.location.reload()} 
        isFatal={true}
      />
    );
  } catch (fallbackError) {
    // Reactレンダリングが失敗した場合のフォールバック
    logError('エラー表示の生成に失敗しました', { error: fallbackError });
    
    errorContainer.innerHTML = `
      <div class="error-container" role="alert">
        <h2>エラーが発生しました</h2>
        <p>${appError.message}</p>
        <button onclick="window.location.reload()">再読み込み</button>
      </div>
    `;
  }
}

/**
 * アプリケーションのレンダリングを実行する関数
 * DOMコンテナの検証、ルートの作成、アプリケーションのレンダリングを行う
 */
function renderApp(): void {
  try {
    // アプリケーションのコンテナを取得
    const container = document.getElementById('app');
    if (!container) {
      throw createError('SYSTEM', 'DOM_ERROR', ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);
    }

    // Reactルートを作成してアプリケーションをレンダリング
    const root = createRoot(container);
    root.render(
      isDevelopment ? (
        <StrictMode>
          <RenderWithErrorHandling />
        </StrictMode>
      ) : (
        <RenderWithErrorHandling />
      ),
    );
  } catch (error) {
    handleFatalError(error);
  }
}

// DOMの準備ができたらアプリケーションをレンダリング
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}