import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Map.module.css';
import MapError from './MapError';
import { ERROR_MESSAGES, MAPS_CONFIG } from '../../utils/constants';
import { MapComponentProps, Poi, AreaType } from '../../utils/types';
import { Marker } from '../marker/Marker';

// トップレベルの例外チェックを削除

const MAP_ARIA_LABEL = '地図コンテンツ';
const LOADING_ARIA_LABEL = '地図読み込み中';

const getMarkerZIndex = (areaType: AreaType): number => {
  switch (areaType) {
    case 'RECOMMEND':
      return 100;
    case 'CURRENT_LOCATION':
      return 90;
    default:
      return 10;
  }
};

export const Map: React.FC<ExtendedMapProps> = ({
  onLoad,
  pois = [],
  selectedPoi = null,
  onMarkerClick = () => {},
}) => {
  // 設定チェックをコンポーネント内部で行う
  useEffect(() => {
    if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
      setMapError(new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING));
    }
  }, []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey || '',
    mapIds: MAPS_CONFIG.mapId ? [MAPS_CONFIG.mapId] : [],
    libraries: MAPS_CONFIG.libraries,
    version: MAPS_CONFIG.version,
    language: MAPS_CONFIG.language,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<Error | null>(null);

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

  // マーカーのレンダリングを効率化
  const renderMarkers = useCallback(() => {
    if (!mapRef.current || pois.length === 0) return null;

    return pois.map((poi) => (
      <Marker
        key={poi.id}
        poi={poi}
        map={mapRef.current}
        onClick={onMarkerClick}
        isSelected={selectedPoi?.id === poi.id}
        zIndex={getMarkerZIndex(poi.area)}
      />
    ));
  }, [pois, selectedPoi, onMarkerClick]);

  useEffect(() => {
    // マップのイベントリスナーなどをセットアップする場合はここで行う

    return () => {
      // クリーンアップ処理
      mapRef.current = null;
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer} aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
        マップを読み込み中...
      </div>
    );
  }

  if (loadError) {
    console.error('Google Maps API読み込みエラー:', loadError);
    return (
      <MapError
        message={loadError.message || ERROR_MESSAGES.MAP.LOAD_FAILED}
        details="Google Maps APIの読み込みに失敗しました。ネットワーク接続とAPIキーを確認してください。"
        onRetry={handleRetry}
      />
    );
  }

  if (mapError) {
    console.error('マップエラー:', mapError);
    return (
      <MapError
        message={mapError.message || ERROR_MESSAGES.MAP.LOAD_FAILED}
        details="マップの表示中にエラーが発生しました。"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className={styles.mapContainer}>
      <GoogleMap
        mapContainerClassName={styles.mapContainer}
        center={MAPS_CONFIG.defaultCenter}
        zoom={MAPS_CONFIG.defaultZoom}
        options={MAPS_CONFIG.options}
        onLoad={handleMapLoad}
        aria-label={MAP_ARIA_LABEL}
      >
        {renderMarkers()}
      </GoogleMap>
    </div>
  );
};

Map.displayName = 'Map';

export default Map;
