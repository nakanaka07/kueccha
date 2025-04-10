import { useRef, useEffect } from 'react';

import { logger } from '@/utils/logger';

/**
 * Google Mapsを表示するためのコンテナコンポーネントのプロパティ定義
 */
interface MapContainerProps {
  /** マップ要素がDOM上に準備完了した時に呼び出されるコールバック */
  onMapElementReady: () => void;
  /** コンテナに適用するCSSクラス名 */
  className?: string;
  /** マップ要素のID */
  mapId?: string;
  /** 初期化までの遅延時間（ミリ秒） */
  initDelay?: number;
  /** マップ読み込み失敗時のリトライ回数 */
  maxRetries?: number;
}

/**
 * Google Mapsを表示するためのコンテナコンポーネント
 * KISS原則に基づいてシンプル化されています
 */
export const MapContainer = ({
  onMapElementReady,
  className = 'map-container',
  mapId = 'google-map',
  initDelay = 0,
}: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const callbackFiredRef = useRef(false);

  // マップ要素の初期化
  useEffect(() => {
    if (callbackFiredRef.current) return;

    const initMap = () => {
      if (!mapRef.current) {
        logger.warn('マップ要素が見つかりません', { component: 'MapContainer' });
        return;
      }

      logger.debug('マップ要素の初期化を開始します', {
        component: 'MapContainer',
        elementId: mapId,
        elementExists: Boolean(mapRef.current),
      });

      // コールバック呼び出しフラグを設定
      callbackFiredRef.current = true;

      // コールバック実行
      onMapElementReady();
    };

    // 遅延が指定されている場合はタイマーを設定
    if (initDelay > 0) {
      const timerId = window.setTimeout(initMap, initDelay);

      // クリーンアップ関数
      return () => {
        window.clearTimeout(timerId);
      };
    } else {
      // 遅延なしで即時実行
      initMap();
    }
  }, [onMapElementReady, mapId, initDelay]);

  return <div id={mapId} ref={mapRef} className={className} data-testid='map-container' />;
};
