import { useRef, useEffect, useCallback } from 'react';

import { logger, LogLevel } from '@/utils/logger';

/**
 * Google Mapsを表示するためのコンテナコンポーネントのプロパティ定義
 */
interface MapContainerProps {
  /** マップ要素がDOM上に準備完了した時に呼び出されるコールバック */
  onMapElementReady: () => void;
  /** コンテナに適用するCSSクラス名 */
  className?: string;
}

/**
 * Google Mapsを表示するためのコンテナコンポーネント
 *
 * マップ要素がDOM上に追加された後にコールバック関数を呼び出します。
 * ロガーを使用して開発環境では詳細なログを出力し、パフォーマンス計測も行います。
 *
 * @param props - コンポーネントのプロパティ
 * @returns React コンポーネント
 */
export const MapContainer = ({
  onMapElementReady,
  className = 'map-container',
}: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const callbackFiredRef = useRef(false);

  // コールバック処理を最適化：useCallbackで再レンダリングによる不要な再生成を防止
  const handleMapElementReady = useCallback(() => {
    logger.info('マップ要素の準備完了コールバックを呼び出します', {
      component: 'MapContainer',
    });

    // パフォーマンス計測を行いながらコールバックを実行
    logger.measureTime('マップ要素準備完了処理', () => onMapElementReady(), LogLevel.INFO, {
      component: 'MapContainer',
    });
  }, [onMapElementReady]);

  useEffect(() => {
    // 要素が存在し、まだコールバックが発火していない場合のみ実行
    if (mapRef.current && !callbackFiredRef.current) {
      logger.debug('マップ要素がDOMに追加されました', {
        component: 'MapContainer',
        elementId: 'map',
      });

      // コールバックの発火を記録
      callbackFiredRef.current = true;

      // DOM更新後にコールバックを実行するための最小限の遅延
      // 地図ライブラリの初期化タイミングに関する互換性のため100msの遅延を維持
      setTimeout(handleMapElementReady, 100);
    }
  }, [handleMapElementReady]);

  return <div id='map' ref={mapRef} className={className}></div>;
};
