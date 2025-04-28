import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

// クライアント側では validateClientEnv を使用
import { validateClientEnv } from './config/client-validator';
// サーバー側の validateEnv は直接呼び出さない（設定ファイルでのみ使用）

import '@/global.css';
import App from '@/App';
import { getEnvVar, getEnvBool } from '@/env/core';
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
 * 文字列からLogLevelへの変換
 */
function getLogLevelFromString(level: string): LogLevel {
  const lowerLevel = level.toLowerCase();
  const isDev = getEnvBool('VITE_ENV_IS_DEV', false);

  // 安全な判定方法を使用（オブジェクトインジェクション攻撃を防止）
  switch (lowerLevel) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    default:
      return isDev ? LogLevel.INFO : LogLevel.WARN;
  }
}

/**
 * 環境変数からロガー設定を構成
 */
function configureLoggerFromEnv(): void {
  const isDev = getEnvBool('VITE_ENV_IS_DEV', false);
  const logLevelStr = getEnvVar({
    key: 'VITE_LOG_LEVEL',
    defaultValue: isDev ? 'info' : 'warn',
  });
  // ロガーレベルを文字列から変換（型安全）
  const logLevel = getLogLevelFromString(logLevelStr); // 環境変数ガイドラインに従い、明示的にブール値に変換
  const enableConsole = getEnvBool('VITE_LOG_ENABLE_CONSOLE', true);
  // ロガーの構成（標準コンテキスト項目を含む）
  logger.configure({
    minLevel: logLevel,
    enableConsole,
    includeTimestamps: true,

    // パフォーマンス最適化: サンプリングレート設定 (Map インスタンスを使用)
    samplingRates: new Map<string, number>([
      ['マーカー', 10],
      ['マーカー可視性更新', 5],
      ['マーカー生成/更新', 2],
    ]),
    // コンテキスト情報の拡張（構造化ログ）
    contextFormatter: ctx => ({
      ...ctx,
      appName: getEnvVar({ key: 'VITE_APP_NAME', defaultValue: 'kueccha' }),
      environment: getEnvVar({ key: 'VITE_ENV_MODE', defaultValue: 'unknown' }),
      version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    }),
  });
  logger.info('ロガー設定を環境変数から読み込みました', {
    level: logLevelStr,
    console: getEnvVar({ key: 'VITE_LOG_ENABLE_CONSOLE', defaultValue: 'true' }),
    env: getEnvVar({ key: 'VITE_ENV_MODE', defaultValue: 'unknown' }),
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
  const isDev = getEnvBool('VITE_ENV_IS_DEV', false);
  const defaultLevel = isDev ? LogLevel.INFO : LogLevel.WARN;
  logger.configure({ minLevel: defaultLevel });
  logger.info('デバッグモードが無効になりました', {
    component: 'main',
    action: 'disable_debug',
  });
}

/**
 * デバッグ機能のセットアップ（開発環境のみ）
 * ガイドラインに従いコンソールデバッグ機能を提供
 */
function setupDebugFunctions(): void {
  const isDev = getEnvBool('VITE_ENV_IS_DEV', false);
  if (!isDev) return;

  window.enableDebugMode = enableDebugMode;
  window.disableDebugMode = disableDebugMode;
  window.getDebugLogs = () => logger.getRecentLogs();

  logger.info('デバッグ機能をセットアップしました', {
    component: 'main',
  });
}

/**
 * グローバルエラーハンドリングの設定
 * エラー境界とロギングを統合
 */
function setupGlobalErrorHandlers(): void {
  // 未処理のエラーをキャプチャ
  window.addEventListener('error', event => {
    logger.error('未捕捉のエラーが発生しました', {
      component: 'ErrorHandler',
      message: event.message,
      source: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      stackTrace: event.error && event.error instanceof Error ? event.error.stack : undefined,
    });
  });

  // 未処理のPromiseエラーをキャプチャ
  window.addEventListener('unhandledrejection', event => {
    const errorReason = event.reason;
    const errorMessage =
      typeof errorReason === 'string'
        ? errorReason
        : errorReason instanceof Error
          ? errorReason.message
          : 'Unknown error';
    logger.error('未処理のPromiseエラーが発生しました', {
      component: 'ErrorHandler',
      reason: errorMessage,
      stack: errorReason instanceof Error ? errorReason.stack : undefined,
    });
  });

  logger.debug('グローバルエラーハンドラーを設定しました', {
    component: 'main',
  });
}

/**
 * アプリケーションの初期化処理
 * 各初期化ステップを順次実行
 */
async function initializeApplication(): Promise<void> {
  // Return void, no boolean needed
  try {
    // アプリケーション起動をログに記録
    logger.info('アプリケーションを初期化しています', {
      component: 'main',
      environment: getEnvVar({ key: 'VITE_ENV_MODE', defaultValue: 'unknown' }),
      version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    });

    // ロガー設定の初期化
    configureLoggerFromEnv(); // 環境変数の検証 (クライアント側用のvalidateClientEnvを使用)
    await logger.measureTimeAsync(
      '環境変数の検証',
      async () => {
        // クライアント側の環境変数検証
        const isValid = validateClientEnv();
        if (!isValid) {
          throw new Error('環境変数の検証に失敗しました');
        }
        await Promise.resolve(); // 非同期コンテキスト用 (measureTimeAsync のため)
      },
      getEnvBool('VITE_ENV_IS_DEV', false) ? LogLevel.INFO : LogLevel.DEBUG
    );

    // テスト環境用のロガー設定
    const isTestEnv = getEnvBool('VITE_ENV_IS_TEST', false);
    if (isTestEnv) {
      const isCIEnvironment = Boolean(import.meta.env.CI);
      logger.configure({
        minLevel: LogLevel.ERROR,
        enableConsole: !isCIEnvironment,
      });
    }

    // デバッグ機能のセットアップ
    setupDebugFunctions();
    // グローバルエラーハンドラの設定
    setupGlobalErrorHandlers();
  } catch (error: unknown) {
    logger.error('アプリケーションの初期化中にエラーが発生しました', {
      component: 'main',
      errorType: 'InitializationError',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // 初期化エラーはここで捕捉され、以降のレンダリングは行われない
    throw error; // Re-throw to prevent rendering attempt in mountApplication
  }
}

/**
 * アプリケーションのレンダリング処理
 * DOMへのマウントとエラーハンドリングを担当
 */
function renderApplication(): void {
  // Remove isEnvValid parameter
  const rootElement = document.getElementById('root');

  // エラーケースの処理
  if (!rootElement) {
    document.body.innerHTML =
      '<div class="critical-error">アプリケーションの読み込みに失敗しました。</div>';

    logger.error('マウントエラー', {
      component: 'ReactDOM',
      errorDetail: 'rootエレメントが見つかりません',
      selector: '#root',
      documentState: document.readyState,
    });
    return;
  } // 環境に応じたStrictModeの使用
  const isDev = getEnvBool('VITE_ENV_IS_DEV', false);
  const AppWithMode =
    isDev === true ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    );

  // Reactアプリケーションのレンダリング
  ReactDOM.createRoot(rootElement).render(AppWithMode);

  logger.info('アプリケーションをマウントしました', {
    component: 'main',
  });
}

/**
 * アプリケーションの起動プロセス
 */
async function mountApplication(): Promise<void> {
  try {
    // アプリケーションの初期化
    await initializeApplication(); // isEnvValid を受け取らない

    // アプリケーションのレンダリング
    renderApplication(); // isEnvValid を渡さない
  } catch (error: unknown) {
    // initializeApplication からスローされたエラー、または他の予期せぬエラー
    logger.error('アプリケーションの起動に失敗しました', {
      component: 'main',
      errorType: 'StartupError',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // オプション: ユーザーにエラーメッセージを表示するフォールバックUIをここに表示
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML =
        '<div class="critical-error">アプリケーションの起動に失敗しました。管理者に連絡してください。</div>';
    } else {
      document.body.innerHTML =
        '<div class="critical-error">重大なエラーが発生しました。ページをリロードしてください。</div>';
    }
  }
}

// アプリケーションの起動
mountApplication().catch(error => {
  // mountApplication 内で既にログ記録されているため、ここでは最小限のログに留めるか、何もしない
  console.error('Unhandled error during application mount:', error); // Fallback console log
});
