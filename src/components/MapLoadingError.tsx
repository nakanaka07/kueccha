import React, { useEffect } from 'react';

import { getEnvVar } from '@/utils/env';
import { logger } from '@/utils/logger';

/**
 * MapLoadingErrorコンポーネントのプロパティ
 */
interface MapLoadingErrorProps {
  /** エラーメッセージまたはエラーオブジェクト */
  error: string | Error;
  /** リトライ処理のコールバック関数 */
  onRetry?: () => void;
  /** 代替手段の表示を制御 */
  showAlternatives?: boolean;
}

/**
 * エラーメッセージを取得する関数
 */
const getErrorMessage = (error: string | Error): string => {
  if (typeof error === 'string') return error;
  return error.message || '不明なエラーが発生しました';
};

/**
 * Google Maps API読み込み失敗時のフォールバックコンポーネント
 * ユーザーに適切なエラー情報と代替手段を提供
 */
const MapLoadingError: React.FC<MapLoadingErrorProps> = ({
  error,
  onRetry,
  showAlternatives = true,
}) => {
  const errorMessage = getErrorMessage(error);
  const googleMapsUrl = getEnvVar({
    key: 'VITE_GOOGLE_MAPS_FALLBACK_URL',
    defaultValue: 'https://www.google.com/maps/search/?api=1&query=佐渡島',
  });

  useEffect(() => {
    // エラー発生時にログを記録
    logger.error('地図読み込みエラー', {
      component: 'MapLoadingError',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      errorMessage,
      timestamp: new Date().toISOString(),
    });
  }, [error, errorMessage]);

  return (
    <div className='map-loading-error'>
      <h2>地図の読み込みに失敗しました</h2>
      <p className='error-message'>{errorMessage}</p>

      {onRetry && (
        <button
          onClick={() => {
            logger.info('地図再読み込み試行', { component: 'MapLoadingError' });
            onRetry();
          }}
          className='retry-button'
        >
          再試行
        </button>
      )}

      {showAlternatives && (
        <>
          <div className='error-alternatives'>
            <p>代替手段:</p>
            <ul>
              <li>
                <a
                  href={googleMapsUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() =>
                    logger.info('外部地図リンククリック', { component: 'MapLoadingError' })
                  }
                >
                  Google Mapsで佐渡島を表示
                </a>
              </li>
              <li>
                <a
                  href='#poi-list'
                  onClick={() =>
                    logger.info('POIリストリンククリック', { component: 'MapLoadingError' })
                  }
                >
                  POI一覧を表示
                </a>
              </li>
            </ul>
          </div>

          <div className='error-help'>
            <p>問題が解決しない場合:</p>
            <ul>
              <li>インターネット接続を確認してください</li>
              <li>ブラウザのキャッシュをクリアしてみてください</li>
              <li>別のブラウザで試してみてください</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default MapLoadingError;
