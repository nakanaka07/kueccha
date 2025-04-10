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
 * 文字列からLogLevelへの変換（型安全に実装）
 */
function getLogLevelFromString(level: string): LogLevel {
  const lowerLevel = level.toLowerCase();
  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  }; // 型安全なENVアクセス  // 型安全にアクセスするため、オプショナルチェーンと型ガードを使用
  const isDev = Boolean(ENV?.env?.isDev);
  return levelMap[lowerLevel] ?? (isDev ? LogLevel.INFO : LogLevel.WARN);
}

/**
 * 環境変数からロガー設定を構成
 */
function configureLoggerFromEnv(): void {
  const logLevelStr = getEnv('VITE_LOG_LEVEL', {
    defaultValue: ENV?.env?.isDev === true ? 'info' : 'warn',
  });
  // ロガーレベルを文字列から変換（型安全）
  const logLevel = getLogLevelFromString(logLevelStr);
  // 環境変数ガイドラインに従い、明示的にブール値に変換
  const enableConsole = toBool(getEnv('VITE_LOG_ENABLE_CONSOLE', { defaultValue: 'true' }));
  // ロガーの構成（標準コンテキスト項目を含む）
  logger.configure({
    minLevel: logLevel,
    enableConsole,
    includeTimestamps: true,

    // パフォーマンス最適化: サンプリングレート設定
    samplingRates: {
      マーカー: 10,
      マーカー可視性更新: 5,
      'マーカー生成/更新': 2,
    },
    // コンテキスト情報の拡張（構造化ログ）
    contextFormatter: ctx => ({
      ...ctx,
      appName: ENV?.app?.name ?? 'kueccha',
      environment: ENV?.env?.mode ?? 'unknown',
      version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    }),
  });
  logger.info('ロガー設定を環境変数から読み込みました', {
    level: logLevelStr,
    console: getEnv('VITE_LOG_ENABLE_CONSOLE', { defaultValue: 'true' }),
    env: ENV?.env?.mode ?? 'unknown',
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
  const typedENV = ENV;
  const isDev = Boolean(typedENV?.env?.isDev);
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
  const typedENV = ENV;
  const isDev = Boolean(typedENV?.env?.isDev);
  if (!isDev) return;

  window.enableDebugMode = enableDebugMode;
  window.disableDebugMode = disableDebugMode;
  window.getDebugLogs = () => logger.getRecentLogs();

  logger.info('デバッグ機能をセットアップしました', {
    component: 'main',
  });
}

/**
 * 環境変数エラー時のUI表示
 * ユーザーに分かりやすいエラー通知を提供
 */
function showEnvErrorNotification(message: string): void {
  const errorElement = document.createElement('div');
  errorElement.className = 'env-error-notification';
  errorElement.textContent = message;
  document.body.prepend(errorElement);

  logger.error('環境変数エラー', {
    component: 'ConfigValidator',
    errorType: 'ConfigurationError',
    details: '必須環境変数の欠落',
    resolution: '.env.exampleを参考に.envファイルを設定してください',
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
async function initializeApplication(): Promise<boolean> {
  try {
    // アプリケーション起動をログに記録
    const typedENV = ENV;
    logger.info('アプリケーションを初期化しています', {
      component: 'main',
      environment: typedENV?.env?.mode ?? 'unknown',
      version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    });

    // ロガー設定の初期化
    configureLoggerFromEnv();

    // テスト環境用のロガー設定
    if (isTestEnvironment()) {
      const isCIEnvironment = Boolean(import.meta.env.CI);
      logger.configure({
        minLevel: LogLevel.ERROR,
        enableConsole: !isCIEnvironment,
      });
    }

    // デバッグ機能のセットアップ
    setupDebugFunctions();
    // グローバルエラーハンドラの設定
    setupGlobalErrorHandlers(); // 環境変数の検証（パフォーマンス測定付き）
    const isDev = Boolean(typedENV?.env?.isDev);
    const isEnvValid = await logger.measureTimeAsync(
      '環境変数の検証',
      async () => {
        await Promise.resolve(); // 非同期コンテキスト用
        return validateEnv();
      },
      isDev ? LogLevel.INFO : LogLevel.DEBUG
    );

    // 開発環境でのエラー通知
    if (import.meta.env.DEV && !isEnvValid) {
      showEnvErrorNotification(
        '必要な環境変数が設定されていません。アプリケーションが正常に動作しない可能性があります。'
      );
    }

    return isEnvValid;
  } catch (error: unknown) {
    logger.error('アプリケーションの初期化中にエラーが発生しました', {
      component: 'main',
      errorType: 'InitializationError',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * アプリケーションのレンダリング処理
 * DOMへのマウントとエラーハンドリングを担当
 */
function renderApplication(isEnvValid: boolean): void {
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
  const typedENV = ENV;
  const isDev = Boolean(typedENV?.env?.isDev);
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
    envStatus: isEnvValid ? '正常' : '警告あり',
  });
}

/**
 * アプリケーションの起動プロセス
 */
async function mountApplication(): Promise<void> {
  try {
    // アプリケーションの初期化
    const isEnvValid = await initializeApplication();

    // アプリケーションのレンダリング
    renderApplication(isEnvValid);
  } catch (error: unknown) {
    logger.error('アプリケーションの起動に失敗しました', {
      component: 'main',
      errorType: 'StartupError',
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

// アプリケーションの起動
mountApplication().catch(error => {
  logger.error('アプリケーションの起動に失敗しました', {
    error,
    errorType: 'StartupError',
  });
});
