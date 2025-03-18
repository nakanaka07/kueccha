import React, { Suspense, StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorDisplay } from './components/ErrorDisplay';
import { ERROR_MESSAGES } from './constants/constants';
import { createError } from './utils/errors';

// 遅延ロードでAppコンポーネントをインポート
const App = lazy(() => import('./App'));

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * アプリをレンダリングする関数
 */
function renderApp() {
  try {
    const container = document.getElementById('app');
    if (!container) {
      throw createError('SYSTEM', 'DOM_ERROR', ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);
    }

    const root = createRoot(container);

    root.render(
      <>
        {isDevelopment ? (
          <StrictMode>
            <RenderWithErrorHandling />
          </StrictMode>
        ) : (
          <RenderWithErrorHandling />
        )}
      </>,
    );
  } catch (error) {
    handleFatalError(error);
  }
}

/**
 * エラーハンドリング付きのレンダリングコンポーネント
 */
const RenderWithErrorHandling: React.FC = () => (
  <Suspense fallback={<div className="loading-app">アプリを読み込み中...</div>}>
    <App />
  </Suspense>
);

/**
 * 致命的なエラー処理関数
 */
function handleFatalError(error: unknown) {
  console.error('アプリケーションの初期化に失敗しました:', error);

  const errorContainer = document.getElementById('app') || document.body;

  const appError = createError(
    'SYSTEM',
    'INIT_FAILED',
    error instanceof Error ? error.message : '予期せぬエラーが発生しました',
    'FATAL_STARTUP_ERROR',
  );

  try {
    const errorRoot = createRoot(errorContainer);
    errorRoot.render(<ErrorDisplay error={appError} onRetry={() => location.reload()} />);
  } catch {
    errorContainer.innerHTML = `
      <div class="error-container">
        <h2>エラーが発生しました</h2>
        <p>${appError.message}</p>
        <button onclick="location.reload()">再読み込み</button>
      </div>
    `;
  }
}

// DOMの準備ができ次第レンダリング開始
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
