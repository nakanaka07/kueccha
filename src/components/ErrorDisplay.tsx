import React from 'react';

import { ERROR_MESSAGES } from '../constants';

// エラータイプを定義
export type ErrorType = 'map' | 'data' | 'network' | 'permission' | 'system' | 'unknown';

// エラー表示コンポーネントのプロパティ型
export interface ErrorDisplayProps {
  /** エラーの種類 */
  type?: ErrorType;

  /** カスタムエラーメッセージ（指定しない場合はタイプに基づいて自動選択） */
  message?: string;

  /** エラーの詳細メッセージ */
  detailMessage?: string;

  /** 再試行ボタンをクリックしたときのコールバック */
  onRetry?: () => void;

  /** 代替アクションを実行するボタンの表示テキスト */
  alternativeActionText?: string;

  /** 代替アクションのコールバック */
  onAlternativeAction?: () => void;

  /** カスタムスタイルクラス */
  className?: string;
}

/**
 * エラー表示コンポーネント
 * さまざまなエラーシナリオに対応する汎用的なエラー表示
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'unknown',
  message,
  detailMessage,
  onRetry,
  alternativeActionText,
  onAlternativeAction,
  className = '',
}) => {
  // エラータイプに基づいてデフォルトメッセージを決定
  const getDefaultMessage = () => {
    switch (type) {
      case 'map':
        return ERROR_MESSAGES.MAP.LOAD_FAILED;
      case 'data':
        return ERROR_MESSAGES.DATA.FETCH_FAILED;
      case 'network':
        return 'ネットワーク接続に問題があります。';
      case 'permission':
        return ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
      case 'system':
        return ERROR_MESSAGES.SYSTEM.GENERAL_ERROR;
      default:
        return 'エラーが発生しました。';
    }
  };

  // 表示するメッセージを決定
  const displayMessage = message || getDefaultMessage();

  return (
    <div role="alert" aria-live="assertive" className={`error-display ${className}`}>
      <div className="error-display-content">
        <h2 className="error-title">
          {type === 'map'
            ? '地図の読み込みに失敗しました'
            : type === 'data'
              ? 'データの読み込みに失敗しました'
              : 'エラーが発生しました'}
        </h2>
        <p className="error-message">{displayMessage}</p>
        {detailMessage ? <p className="error-detail">{detailMessage}</p> : null}
        <div className="error-actions">
          {onRetry ? (
            <button onClick={onRetry} className="retry-button" aria-label="再読み込み">
              再試行
            </button>
          ) : null}
          {onAlternativeAction && alternativeActionText ? (
            <button onClick={onAlternativeAction} className="alternative-action">
              {alternativeActionText}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
