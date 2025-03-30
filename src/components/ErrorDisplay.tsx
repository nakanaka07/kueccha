import React from 'react';

import { logger } from '@/utils/logger';

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
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onError,
  reloadButtonText = '再読み込み',
  title = 'エラーが発生しました',
  className = '',
  onErrorShown,
}) => {
  // コンポーネントマウント時に追加のエラーハンドリングを実行
  React.useEffect(() => {
    // エラーをログに記録
    logger.error('UIにエラーが表示されました', {
      message,
      component: 'ErrorDisplay',
      timestamp: new Date().toISOString(),
    });

    // コールバック実行
    onError?.();

    // エラー表示通知コールバック
    onErrorShown?.();
  }, [message, onError, onErrorShown]);

  // 再読み込みハンドラ
  const handleReload = React.useCallback(() => {
    logger.info('ユーザーが再読み込みを実行', {
      component: 'ErrorDisplay',
      errorMessage: message,
    });
    window.location.reload();
  }, [message]);

  return (
    <div
      className={`error-container ${className}`}
      role='alert'
      aria-live='assertive'
      data-testid='error-display'
    >
      <h2>{title}</h2>
      <p>{message}</p>
      <button
        type='button'
        onClick={handleReload}
        className='error-reload-button'
        aria-label={`${reloadButtonText}: ${message}`}
      >
        {reloadButtonText}
      </button>
    </div>
  );
};

export default ErrorDisplay;
