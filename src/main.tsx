import React, { Suspense, StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ERRORS } from '@core/constants/messages';
import { createError } from '@core/error';
import { ErrorDisplay } from '@shared/components/ui/error/ErrorDisplay';

// 遅延ロード
const App = lazy(() => import('@app/App'));

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * アプリをレンダリングする関数
 */
function renderApp() {
  try {
    // コンテナ要素の取得
    const container = document.getElementById('app');
    if (!container) {
      throw createError('SYSTEM', 'DOM_ERROR', ERRORS.containerNotFound);
    }

    // Reactルートの作成
    const root = createRoot(container);

    // アプリケーションレンダリング
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
    // 致命的なエラーの場合はフォールバック処理
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

  // エラーコンテナの取得またはフォールバック
  const errorContainer = document.getElementById('app') || document.body;

  // 標準化されたエラーオブジェクトの作成
  const appError = createError(
    'SYSTEM',
    'INIT_FAILED',
    error instanceof Error ? error.message : '予期せぬエラーが発生しました',
    'FATAL_STARTUP_ERROR',
  );

  // create-root APIを使用してエラー表示をレンダリング
  try {
    const errorRoot = createRoot(errorContainer);
    errorRoot.render(<ErrorDisplay error={appError} onRetry={() => location.reload()} />);
  } catch {
    // 最後の手段としてのプレーンHTMLフォールバック
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
