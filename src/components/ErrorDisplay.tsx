import React from 'react';

import { LogLevel } from '@/utils/logger';
import { logWithLevel, summarizeMessage } from '@/utils/logging';

interface ErrorDisplayProps {
  message: string;
  /**
   * エラーが発生した時に実行される追加のコールバック関数
   */
  onError?: () => void;
  /**
   * 再読み込みボタンのテキスト
   * @default "再読み込み"
   */
  reloadButtonText?: string;
  /**
   * エラータイトル
   * @default "エラーが発生しました"
   */
  title?: string;
  /**
   * カスタムCSSクラス名
   */
  className?: string;
  /**
   * エラーがユーザーに表示されたことを示すコールバック
   */
  onErrorShown?: () => void;
}

/**
 * ユーザーに分かりやすくエラーを表示し、再読み込み機能を提供するコンポーネント
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   message="データの読み込みに失敗しました"
 *   onError={() => trackError('data-load-error')}
 * />
 * ```
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = React.memo(
  ({
    message,
    onError,
    reloadButtonText = '再読み込み',
    title = 'エラーが発生しました',
    className = '',
    onErrorShown,
  }) => {
    // コンポーネントマウント時に追加のエラーハンドリングを実行
    React.useEffect(() => {
      // エラーをログに記録（エラーレベルを明示的に使用）
      const errorLevel = LogLevel.ERROR;
      const logMessage = summarizeMessage(message);

      logWithLevel(errorLevel, 'UIにエラーが表示されました', {
        message: logMessage,
        component: 'ErrorDisplay',
        action: 'error_display',
        timestamp: new Date().toISOString(),
        details: message.length > 200 ? '長文メッセージは省略されました' : undefined,
        environment: import.meta.env.MODE,
      });

      // コールバック実行
      onError?.();

      // エラー表示通知コールバック
      onErrorShown?.();
    }, [message, onError, onErrorShown]);

    // 再読み込みハンドラ
    const handleReload = React.useCallback(() => {
      // 開発環境では詳細ログ、本番環境ではシンプルなログ
      const logLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
      const shortenedMessage = summarizeMessage(message, 50);

      // ログレベルに応じてログ出力
      const reloadContext = {
        component: 'ErrorDisplay',
        action: 'page_reload',
        errorMessage: shortenedMessage,
      };

      logWithLevel(logLevel, 'ユーザーが再読み込みを実行', reloadContext);

      window.location.reload();
    }, [message]);

    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-md p-4 my-4 ${className}`}
        role='alert'
        aria-live='assertive'
        data-testid='error-display'
      >
        <h2 className='text-lg font-semibold text-red-700 mb-2'>{title}</h2>
        <p className='text-red-600 mb-4'>{message}</p>
        <button
          type='button'
          onClick={handleReload}
          className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors'
          aria-label={`${reloadButtonText}: ${message}`}
        >
          {reloadButtonText}
        </button>
      </div>
    );
  }
);

// 表示名を設定（デバッグ用）
ErrorDisplay.displayName = 'ErrorDisplay';

export default ErrorDisplay;
