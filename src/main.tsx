import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import '@/global.css';
import App from '@/App';
import { ENV, validateEnv } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

/**
 * アプリケーションのエントリーポイント
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

// アプリケーション初期化をログに記録
logger.info('アプリケーションを初期化しています', {
  environment: ENV.env.MODE,
  version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
  build: ENV.env.isProd ? 'production' : 'development',
});

// ログの設定を最適化
logger.configure({
  // 基本レベルはINFO（開発環境）、WARN（本番環境）
  minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN,

  // 特定コンポーネントのログレベルを個別設定
  componentLevels: {
    useMapMarkers: LogLevel.WARN, // マーカー処理は警告以上のみ
    useFilterLogic: LogLevel.WARN, // フィルタ処理は警告以上のみ
    useMarkerVisibility: LogLevel.WARN, // 可視性処理は警告以上のみ
    usePOIData: LogLevel.INFO, // POIデータは情報以上
  },

  // サンプリングレート設定（頻繁に発生するログを間引く）
  samplingRates: {
    マーカー: 10, // マーカー関連は10回に1回記録
    マーカー可視性更新: 5, // 可視性更新は5回に1回記録
    'マーカー生成/更新': 2, // マーカー生成は2回に1回記録
  },
});

// デバッグモードを有効にする関数
function enableDebugMode(): void {
  logger.configure({ minLevel: LogLevel.DEBUG });
  logger.info('デバッグモードが有効になりました');
}

// デバッグモードを無効にする関数
function disableDebugMode(): void {
  logger.configure({ minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN });
  logger.info('デバッグモードが無効になりました');
}

// 環境変数の検証とエラー処理を実行
const isEnvValid = logger.measureTime(
  '環境変数の検証',
  validateEnv,
  ENV.env.isDev ? LogLevel.INFO : LogLevel.DEBUG
);

// ブラウザのグローバルスコープにデバッグ用の関数を公開（開発環境のみ）
if (ENV.env.isDev) {
  // グローバル関数を設定
  window.enableDebugMode = enableDebugMode;
  window.disableDebugMode = disableDebugMode;
  window.getDebugLogs = () => logger.getRecentLogs();

  logger.info('デバッグ機能: コンソールで enableDebugMode() を実行すると詳細ログが有効になります');
}

if (import.meta.env.DEV && !isEnvValid) {
  const errorMessage =
    '必要な環境変数が設定されていません。アプリケーションが正常に動作しない可能性があります。';

  // エラー通知用のUI要素を表示
  const errorElement = document.createElement('div');
  errorElement.className = 'env-error-notification';
  errorElement.textContent = errorMessage;
  document.body.prepend(errorElement);

  // ガイドラインに沿った詳細なエラーログ
  logger.error('環境変数エラー', {
    errorType: 'ConfigurationError',
    details: '必須環境変数の欠落',
    impact: 'アプリケーションの機能が制限されます',
    resolution: '.env.exampleを参考に.envファイルを設定してください',
  });
}

// アプリケーションのマウント処理をパフォーマンス計測
logger
  .measureTimeAsync(
    'アプリケーションのレンダリング',
    async () => {
      const rootElement = document.getElementById('root');

      // root要素が存在することを確認
      if (rootElement) {
        // awaitを追加して非同期処理を明確にする
        await Promise.resolve();
        ReactDOM.createRoot(rootElement).render(
          <StrictMode>
            <App />
          </StrictMode>
        );
        logger.info('アプリケーションのマウントが完了しました');
        return true;
      } else {
        // root要素が見つからない場合のエラーハンドリング
        document.body.innerHTML =
          '<div class="critical-error">アプリケーションの読み込みに失敗しました。</div>';

        // ガイドラインに沿った構造化エラーログ
        logger.error('マウントエラー', {
          errorType: 'DOMError',
          errorDetail: 'rootエレメントが見つかりません',
          selector: '#root',
          documentState: document.readyState,
          bodyChildCount: document.body.childElementCount,
        });

        return false;
      }
    },
    LogLevel.INFO
  )
  .catch((error: unknown) => {
    logger.error(
      '予期せぬエラーが発生しました',
      error instanceof Error ? error : { message: String(error) }
    );
  });

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
