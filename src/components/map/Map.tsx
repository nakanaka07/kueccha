/**
 * マップコンポーネント
 *
 * Google Maps APIを使用して地図を表示するReactコンポーネント。
 * このコンポーネントは地図のロード、表示、エラー処理を担当し、
 * アクセシビリティにも配慮した実装となっている。
 */

// Google Maps APIのReactラッパーからコンポーネントとフックをインポート
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
// Reactの基本フックをインポート
import React, { useCallback, useRef, useState } from 'react';
// コンポーネント用のスタイルをインポート
import styles from './Map.module.css';
// エラー表示用のコンポーネントをインポート
import MapError from './MapError';
// 設定情報とエラーメッセージの定数をインポート
import { ERROR_MESSAGES, MAPS_CONFIG } from '../../utils/constants';
// 型定義をインポート
import { MapComponentProps } from '../../utils/types';

// APIキーとmapIdの存在チェック（型アサーション）
// 設定が不足している場合はアプリケーション起動時にエラーを投げる
if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

// アクセシビリティ用のラベルを定数化
const MAP_ARIA_LABEL = '地図コンテンツ';
const LOADING_ARIA_LABEL = '地図読み込み中';

/**
 * マップコンポーネントの実装
 *
 * @param onLoad - マップがロードされたときに呼び出されるコールバック関数
 * @param setIsMapLoaded - マップのロード状態を親コンポーネントに通知するための関数
 */
export const Map: React.FC<MapComponentProps> = ({ onLoad, setIsMapLoaded }) => {
  // Google Maps APIをロードするためのフック
  // 設定オブジェクトで言語、バージョン、必要なライブラリなどを指定
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey,
    mapIds: [MAPS_CONFIG.mapId],
    libraries: MAPS_CONFIG.libraries,
    version: MAPS_CONFIG.version,
    language: MAPS_CONFIG.language,
  });

  // マップインスタンスへの参照を保持するためのref
  const mapRef = useRef<google.maps.Map | null>(null);

  // マップのエラー状態を管理するstate
  const [mapError, setMapError] = useState<Error | null>(null);

  /**
   * マップがロードされたときのコールバック関数
   * 地図の初期設定を行い、親コンポーネントにマップインスタンスを渡す
   */
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (onLoad) {
        onLoad(map);
      }
      if (setIsMapLoaded) {
        setIsMapLoaded(map);
      }
    },
    [onLoad, setIsMapLoaded],
  );

  /**
   * マップでエラーが発生したときの再試行関数
   * APIの再読み込みを試みる
   */
  const handleRetry = useCallback(() => {
    setMapError(null);
    window.location.reload();
  }, []);

  // APIロード中の表示
  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer} aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
        マップを読み込み中...
      </div>
    );
  }

  // APIロードエラーの表示
  if (loadError) {
    return <MapError message={loadError.message || ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={handleRetry} />;
  }

  // マップエラーの表示
  if (mapError) {
    return <MapError message={mapError.message || ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={handleRetry} />;
  }

  // 正常にAPIが読み込まれた場合、地図を表示
  return (
    <div className={styles.mapContainer}>
      <GoogleMap
        mapContainerClassName={styles.mapContainer}
        center={MAPS_CONFIG.defaultCenter}
        zoom={MAPS_CONFIG.defaultZoom}
        options={{
          mapId: MAPS_CONFIG.mapId,
          disableDefaultUI: true,
          zoomControl: true,
          scrollwheel: true,
          disableDoubleClickZoom: false,
          clickableIcons: false,
        }}
        onLoad={handleMapLoad}
        aria-label={MAP_ARIA_LABEL}
      />
    </div>
  );
};

// React DevToolsでの識別用にコンポーネント名を明示的に設定
Map.displayName = 'Map';

export default Map;
