import { useRef, useEffect, useCallback } from 'react';

/**
 * 開発環境でのみログを出力するユーティリティ関数
 * ESLint の console 警告を回避し、一貫したログ出力を提供
 */
const logDevOnly = (message: string): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
};

/**
 * MapContainerコンポーネントのプロパティ定義
 */
interface MapContainerProps {
  /** マップ要素がDOM上に準備完了した時に呼び出されるコールバック */
  onMapElementReady: () => void;
  /** コンテナに適用するCSSクラス名 */
  className?: string;
}

/**
 * Google Mapsを表示するためのコンテナコンポーネント
 * マップ要素がDOM上に追加された後にコールバック関数を呼び出します
 */
export const MapContainer = ({
  onMapElementReady,
  className = 'map-container',
}: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const callbackFiredRef = useRef(false);

  // コールバック処理を最適化：useCallbackで再レンダリングによる不要な再生成を防止
  const handleMapElementReady = useCallback(() => {
    logDevOnly('MapContainer: onMapElementReady を呼び出します');
    onMapElementReady();
  }, [onMapElementReady]);

  useEffect(() => {
    // 要素が存在し、まだコールバックが発火していない場合のみ実行
    if (mapRef.current && !callbackFiredRef.current) {
      logDevOnly('MapContainer: マップ要素がDOMに追加されました');

      // コールバックの発火を記録
      callbackFiredRef.current = true;

      // DOM更新後にコールバックを実行するための最小限の遅延
      // 地図ライブラリの初期化タイミングに関する互換性のため100msの遅延を維持
      setTimeout(handleMapElementReady, 100);
    }
  }, [handleMapElementReady]);

  return <div id='map' ref={mapRef} className={className}></div>;
};