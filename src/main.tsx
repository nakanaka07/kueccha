/**
 * アプリケーションのエントリーポイント
 * GitHub Pages静的サイト向けに最適化
 */
import { PWA } from '@services/index';
import React, { Suspense, StrictMode, lazy, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingScreen } from './components/LoadingScreen';
import { APP_CONFIG } from './config/app.config';
import { ERROR_MESSAGES, LogLevel } from './constants/constants';
import { createError } from './utils/errors';
import type { AppError } from './utils/errors';
import { logError, logInfo } from './utils/logger';

// 環境設定 - 環境変数の集中管理
const isDevelopment = APP_CONFIG.ENV === 'development';
const basePath = isDevelopment ? APP_CONFIG.BASE_PATH.DEV : APP_CONFIG.BASE_PATH.PROD;

// アプリケーションコンポーネントを遅延ロード
const App = lazy(() =>
  import('./App').catch((error) => {
    logError('APP_LOAD', 'Appコンポーネントの読み込みに失敗しました', {
      error,
      level: LogLevel.ERROR,
      context: 'app_loading',
    });
    throw error;
  }),
);

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
    logError('UI', 'レンダリングエラー', {
      error,
      errorInfo,
      level: LogLevel.ERROR,
      context: 'component_rendering',
    });

    // GitHub Pages環境ではテレメトリ送信（必要に応じて）
    if (!isDevelopment && APP_CONFIG.TELEMETRY_ENABLED) {
      try {
        // エラーテレメトリ送信（実装があれば）
      } catch (sendError) {
        // テレメトリ送信エラーは無視（アプリ機能には影響させない）
      }
    }
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

  // サービスワーカー登録 - 静的サイト向けに最適化
  useEffect(() => {
    const setupServiceWorker = async () => {
      try {
        // GitHub Pages環境ではPWAを有効化、開発環境では無効
        if ('serviceWorker' in navigator && !isDevelopment) {
          await PWA.register();
          logInfo('PWA', 'サービスワーカーの登録に成功しました');
        }
        // PWA登録の成否にかかわらずアプリは起動させる
        setSWRegistered(true);
      } catch (error) {
        logError('PWA', 'サービスワーカー登録エラー', { error });
        // エラーが発生してもアプリは起動させる
        setSWRegistered(true);
      }
    };
    
    setupServiceWorker();
    
    // クリーンアップ（必要に応じて）
    return () => {
      // PWA関連リソースのクリーンアップ
    };
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
  logError('SYSTEM', 'アプリケーション初期化失敗', {
    error,
    level: LogLevel.FATAL,
    context: 'application_startup',
    basePath,
    userAgent: navigator.userAgent,
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
    // 最後の手段としての純HTMLフォールバック
    errorContainer.innerHTML = `
      <div class="error-container" role="alert">
        <h2>エラーが発生しました</h2>
        <p>${appError.message}</p>
        <p>エラー詳細: ${appError.code}</p>
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
  
  // GitHub Pagesのアナリティクスにインストールプロンプト表示を記録（必要に応じて）
  if (!isDevelopment && APP_CONFIG.ANALYTICS_ENABLED) {
    try {
      // インストールプロンプト表示イベント記録（実装があれば）
    } catch (error) {
      // エラーは無視
    }
  }
});