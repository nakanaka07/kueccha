import React from 'react';

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
}

/**
 * ユーザーに分かりやすくエラーを表示し、再読み込み機能を提供するコンポーネント
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onError,
  reloadButtonText = '再読み込み',
}) => {
  // コンポーネントマウント時に追加のエラーハンドリングを実行
  React.useEffect(() => {
    onError?.();
  }, [onError]);

  const handleReload = React.useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className='error-container' role='alert' aria-live='assertive'>
      <h2>エラーが発生しました</h2>
      <p>{message}</p>
      <button type='button' onClick={handleReload} className='error-reload-button'>
        {reloadButtonText}
      </button>
    </div>
  );
};

export default ErrorDisplay;
