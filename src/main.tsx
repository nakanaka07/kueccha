/**
 * アプリケーションのエントリーポイント
 *
 * このファイルはReactアプリケーションの初期化を担当し、
 * 遅延ロード、エラーハンドリング、アプリケーションのレンダリングを管理します。
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

// アプリケーションコンポーネントを遅延ロード（チャンク分割の最適化）
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
 * 子コンポーネントツリーでのレンダリングエラーをキャッチして表示
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
    // エラー発生時の状態を更新
    const appError = createError(
      'UI',
      'RENDER_ERROR',
      error instanceof Error ? error.message : '予期せぬUIエラーが発生しました',
    );
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーログを記録
    logError('UIレンダリングエラーが発生しました', {
      error,
      errorInfo,
      level: LogLevel.ERROR,
      context: 'component_rendering',
    });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // エラー表示
      return <ErrorDisplay error={this.state.error} onRetry={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}

/**
 * サスペンス付きのアプリケーションレンダリングコンポーネント
 * アプリケーションの遅延ロードとローディング状態を管理
 */
const RenderWithErrorHandling: React.FC = React.memo(() => {
  const [isSWRegistered, setSWRegistered] = useState<boolean>(false);

  // サービスワーカー登録
  useEffect(() => {
    if ('serviceWorker' in navigator && !isDevelopment) {
      PWA.register()
        .then(() => setSWRegistered(true))
        .catch((error) => logError('サービスワーカー登録エラー', { error }));
    } else {
      setSWRegistered(true); // 開発環境またはサービスワーカー非対応環境では即座にready
    }
  }, []);

  // サービスワーカー登録待ちの場合はカスタムローディング表示
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
});

// 表示名を設定（デバッグ時に役立つ）
RenderWithErrorHandling.displayName = 'RenderWithErrorHandling';

/**
 * 致命的なエラーを処理する関数
 * Reactレンダリング外のエラーに対応し、ユーザーへの通知とリカバリーオプションを提供
 */
function handleFatalError(error: unknown): void {
  // エラー情報をログに記録
  logError('アプリケーションの初期化に失敗しました', {
    error,
    level: LogLevel.FATAL,
    context: 'application_startup',
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
      <ErrorDisplay error={appError} onRetry={() => window.location.reload()} isFatal={true} />,
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
    // パフォーマンス計測開始
    if (isDevelopment) {
      performance.mark('app-render-start');
    }

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

    // パフォーマンス計測終了
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

// PWAのインストール検知（オプション）
window.addEventListener('beforeinstallprompt', (e) => {
  // PWAインストールイベントを保存（後でインストールボタンから使用可能）
  e.preventDefault();
  window.deferredPrompt = e;
});
