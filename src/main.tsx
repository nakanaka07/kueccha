/**
 * アプリケーションのエントリーポイント
 */
import React, { Suspense, StrictMode, lazy, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { PWA } from '@services/index';

import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingScreen } from './components/LoadingScreen';
import { ERROR_MESSAGES, LogLevel } from './constants/constants';
import { createError } from './utils/errors';
import { logError } from './utils/logger';

import type { AppError } from './utils/errors';

// アプリケーションコンポーネントを遅延ロード
const App = lazy(() =>
  import('./App').catch((error) => {
    logError('Appコンポーネントの読み込みに失敗しました', {
      error,
      level: LogLevel.ERROR,
      context: 'app_loading',
    });
    throw error;
  }),
);

// 環境設定
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * エラーバウンダリーコンポーネント
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: AppError | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): { hasError: boolean; error: AppError } {
    const appError = createError(
      'UI',
      'RENDER_ERROR',
      error instanceof Error ? error.message : '予期せぬUIエラーが発生しました',
    );
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('UIレンダリングエラーが発生しました', {
      error,
      errorInfo,
      level: LogLevel.ERROR,
      context: 'component_rendering',
    });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorDisplay error={this.state.error} onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

/**
 * サスペンス付きのアプリケーションレンダリングコンポーネント
 */
const RenderWithErrorHandling: React.FC = () => {
  const [isSWRegistered, setSWRegistered] = useState<boolean>(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && !isDevelopment) {
      PWA.register()
        .then(() => setSWRegistered(true))
        .catch((error) => logError('サービスワーカー登録エラー', { error }));
    } else {
      setSWRegistered(true);
    }
  }, []);

  if (!isSWRegistered) {
    return <LoadingScreen message="アプリを準備中..." />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen message="アプリを読み込み中..." />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * 致命的なエラーを処理する関数
 */
function handleFatalError(error: unknown): void {
  logError('アプリケーションの初期化に失敗しました', {
    error,
    level: LogLevel.FATAL,
    context: 'application_startup',
  });

  const errorContainer = document.getElementById('app') || document.body;
  const appError = createError(
    'SYSTEM',
    'INIT_FAILED',
    error instanceof Error ? error.message : '予期せぬエラーが発生しました',
  );

  try {
    const errorRoot = createRoot(errorContainer);
    errorRoot.render(
      <ErrorDisplay error={appError} onRetry={() => window.location.reload()} isFatal={true} />,
    );
  } catch (fallbackError) {
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
 */
function renderApp(): void {
  try {
    if (isDevelopment) {
      performance.mark('app-render-start');
    }

    const container = document.getElementById('app');
    if (!container) {
      throw createError('SYSTEM', 'DOM_ERROR', ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);
    }

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

    if (isDevelopment) {
      performance.mark('app-render-end');
      performance.measure('app-render-duration', 'app-render-start', 'app-render-end');
      const measurements = performance.getEntriesByName('app-render-duration');
      console.info(`🚀 App render time: ${measurements[0]?.duration.toFixed(2)}ms`);
    }
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

// PWAのインストール検知
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});