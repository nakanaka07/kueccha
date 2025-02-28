/**
 * マップコンポーネント
 *
 * Google Maps APIを使用して地図を表示するReactコンポーネント。
 * このコンポーネントは地図のロード、表示、エラー処理を担当し、
 * 状態管理は親コンポーネントに委譲します。
 */

import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useRef, useState } from 'react';
import styles from './Map.module.css';
import MapError from './MapError';
import { ERROR_MESSAGES, MAPS_CONFIG } from '../../utils/constants';
import { MapComponentProps } from '../../utils/types';

if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

const MAP_ARIA_LABEL = '地図コンテンツ';
const LOADING_ARIA_LABEL = '地図読み込み中';

/**
 * マップコンポーネントの実装
 *
 * @param onLoad - マップがロードされたときに呼び出されるコールバック関数
 */
export const Map: React.FC<MapComponentProps> = ({ onLoad }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey,
    mapIds: [MAPS_CONFIG.mapId],
    libraries: MAPS_CONFIG.libraries,
    version: MAPS_CONFIG.version,
    language: MAPS_CONFIG.language,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
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
    },
    [onLoad],
  );

  const handleRetry = useCallback(() => {
    setMapError(null);
    window.location.reload();
  }, []);

  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer} aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
        マップを読み込み中...
      </div>
    );
  }

  if (loadError) {
    return <MapError message={loadError.message || ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={handleRetry} />;
  }

  if (mapError) {
    return <MapError message={mapError.message || ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={handleRetry} />;
  }

  return (
    <div className={styles.mapContainer}>
      <GoogleMap
        mapContainerClassName={styles.mapContainer}
        center={MAPS_CONFIG.defaultCenter}
        zoom={MAPS_CONFIG.defaultZoom}
        options={{
          mapId: MAPS_CONFIG.mapId,
          mapTypeId: google.maps.MapTypeId.TERRAIN,
          disableDefaultUI: false,
          disableDoubleClickZoom: false,
          scrollwheel: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          clickableIcons: true,
          gestureHandling: 'cooperative',
        }}
        onLoad={handleMapLoad}
        aria-label={MAP_ARIA_LABEL}
      />
    </div>
  );
};

Map.displayName = 'Map';

export default Map;
