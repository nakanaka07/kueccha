import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import '@/global.css';
import App from '@/App';
import { ENV, validateEnv, getEnv, toBool, isTestEnvironment } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

/**
 * アプリケーションのエントリーポイント
 * - 環境に応じたロガー設定の適用
 * - StrictModeを有効化して開発時の潜在的問題を検出
 * - 環境変数のバリデーションを実行
 * - グローバルスタイルを適用
 */

// グローバルオブジェクトの型拡張（ファイルのトップレベルに定義）
declare global {
  interface Window {
    // デバッグ用の関数を定義
    enableDebugMode?: () => void;
    disableDebugMode?: () => void;
    getDebugLogs?: () => ReturnType<typeof logger.getRecentLogs>;
  }
}

/**
 * 環境変数からロガー設定を構成
 */
function configureLoggerFromEnv(): void {
  const logLevelStr = getEnv('VITE_LOG_LEVEL', {
    defaultValue: ENV.env.isDev ? 'info' : 'warn',
  });

  const getLogLevelFromString = (level: string): LogLevel => {
    switch (level.toLowerCase()) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN;
    }
  };

  // 環境変数とプロジェクト設定に基づくロガー構成
  logger.configure({
    minLevel: getLogLevelFromString(logLevelStr),
    enableConsole: toBool(getEnv('VITE_LOG_ENABLE_CONSOLE', { defaultValue: 'true' })),
    includeTimestamps: true, // タイムスタンプを常に含める

    // 既存の設定を維持
    componentLevels: {
      useMapMarkers: LogLevel.WARN,
      useFilterLogic: LogLevel.WARN,
      useMarkerVisibility: LogLevel.WARN,
      usePOIData: LogLevel.INFO,
    },

    samplingRates: {
      マーカー: 10,
      マーカー可視性更新: 5,
      'マーカー生成/更新': 2,
    },

    // コンテキスト情報の拡張
    contextFormatter: context => ({
      ...context,
      appName: ENV.app.name,
      environment: ENV.env.mode,
      version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    }),
  });

  logger.info('ロガー設定を環境変数から読み込みました', {
    level: logLevelStr,
    console: getEnv('VITE_LOG_ENABLE_CONSOLE', { defaultValue: 'true' }),
    env: ENV.env.mode,
    component: 'main',
    action: 'initialize_logger',
  });
}

// デバッグモードを有効にする関数
function enableDebugMode(): void {
  logger.configure({ minLevel: LogLevel.DEBUG });
  logger.info('デバッグモードが有効になりました', {
    component: 'main',
    action: 'enable_debug',
  });
}

// デバッグモードを無効にする関数
function disableDebugMode(): void {
  logger.configure({ minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN });
  logger.info('デバッグモードが無効になりました', {
    component: 'main',
    action: 'disable_debug',
  });
}

/**
 * デバッグ機能のセットアップ（開発環境のみ）
 */
function setupDebugFunctions(): void {
  if (!ENV.env.isDev) return;

  window.enableDebugMode = enableDebugMode;
  window.disableDebugMode = disableDebugMode;
  window.getDebugLogs = () => logger.getRecentLogs();

  logger.info('デバッグ機能: コンソールで enableDebugMode() を実行すると詳細ログが有効になります', {
    component: 'main',
    action: 'setup_debug',
  });
}

/**
 * 環境変数エラー時のUI表示
 */
function showEnvErrorNotification(message: string): void {
  const errorElement = document.createElement('div');
  errorElement.className = 'env-error-notification';
  errorElement.textContent = message;
  document.body.prepend(errorElement);

  // ガイドラインに沿った詳細なエラーログ
  logger.error('環境変数エラー', {
    errorType: 'ConfigurationError',
    details: '必須環境変数の欠落',
    impact: 'アプリケーションの機能が制限されます',
    resolution: '.env.exampleを参考に.envファイルを設定してください',
  });
}

/**
 * グローバルエラーハンドリングの設定
 */
function setupGlobalErrorHandlers(): void {
  // 未処理のエラーをキャプチャ
  window.addEventListener('error', event => {
    logger.error('未捕捉のエラーが発生しました', {
      message: event.message,
      source: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      error: event.error,
    });
  });

  // 未処理のPromiseエラーをキャプチャ
  window.addEventListener('unhandledrejection', event => {
    const errorReason = event.reason as unknown;
    logger.error('未処理のPromiseエラーが発生しました', {
      reason: errorReason,
      stack: errorReason instanceof Error ? errorReason.stack : undefined,
    });
  });
}

/**
 * アプリケーションの初期化処理
 */
function initializeApplication() {
  // アプリケーション初期化をログに記録
  logger.info('アプリケーションを初期化しています', {
    environment: ENV.env.mode,
    version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    build: ENV.env.isProd ? 'production' : 'development',
  });

  // ロガー設定の初期化
  configureLoggerFromEnv();

  // テスト環境用の設定
  if (isTestEnvironment()) {
    logger.configure({
      minLevel: LogLevel.ERROR,
      enableConsole: !toBool(String(import.meta.env.CI)),
    });
  }

  // デバッグ機能のセットアップ
  setupDebugFunctions();

  // 環境変数の検証
  const isEnvValid = logger.measureTime(
    '環境変数の検証',
    validateEnv,
    ENV.env.isDev ? LogLevel.INFO : LogLevel.DEBUG
  );

  // 環境変数エラーの処理
  if (import.meta.env.DEV && !isEnvValid) {
    showEnvErrorNotification(
      '必要な環境変数が設定されていません。アプリケーションが正常に動作しない可能性があります。'
    );
  }

  return { isEnvValid };
}

/**
 * アプリケーションのマウント処理
 */
async function mountApplication(): Promise<void> {
  try {
    // アプリケーションの初期化
    const { isEnvValid } = initializeApplication();

    // グローバルエラーハンドラの設定
    setupGlobalErrorHandlers();

    // アプリケーションのマウント処理をパフォーマンス計測
    await logger.measureTimeAsync(
      'アプリケーションのレンダリング',
      async () => {
        const rootElement = document.getElementById('root');

        if (!rootElement) {
          document.body.innerHTML =
            '<div class="critical-error">アプリケーションの読み込みに失敗しました。</div>';

          logger.error('マウントエラー', {
            errorType: 'DOMError',
            errorDetail: 'rootエレメントが見つかりません',
            selector: '#root',
            documentState: document.readyState,
            bodyChildCount: document.body.childElementCount,
          });

          return false;
        }

        // StrictModeは開発環境のみで使用
        const AppWithMode = ENV.env.isDev ? (
          <StrictMode>
            <App />
          </StrictMode>
        ) : (
          <App />
        );

        await Promise.resolve();
        ReactDOM.createRoot(rootElement).render(AppWithMode);
        logger.info('アプリケーションのマウントが完了しました', {
          envStatus: isEnvValid ? '正常' : '警告あり',
        });
        return true;
      },
      LogLevel.INFO
    );
  } catch (error: unknown) {
    logger.error(
      '予期せぬエラーが発生しました',
      error instanceof Error ? error : { message: String(error) }
    );
  }
}

// アプリケーションの起動
mountApplication().catch(error => {
  logger.error('アプリケーションの起動に失敗しました', {
    error,
    errorType: 'StartupError',
  });
});
