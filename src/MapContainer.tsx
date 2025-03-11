import { useLoadScript, GoogleMap } from '@react-google-maps/api';
import React, { useCallback, useRef } from 'react';
import MapError from './MapError';
import MapLoading from './MapLoading';
import MarkerList from './MarkerList';
import { useMapConfig } from './useMapConfig';
import type { ExtendedMapProps } from '../../../core/types/map';

const MAP_ARIA_LABEL = '地図コンテンツ';

const MapContainer: React.FC<ExtendedMapProps> = ({
  onLoad,
  pois = [],
  selectedPoi = null,
  onMarkerClick = () => {},
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { configError, apiKey, mapId, libraries, version, language, defaultCenter, defaultZoom, mapOptions } =
    useMapConfig();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    mapIds: mapId ? [mapId] : [],
    libraries,
    version,
    language,
  });

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
    window.location.reload();
  }, []);

  if (configError) {
    return (
      <MapError
        message={configError.message}
        details="マップの設定情報が不足しています。環境変数を確認してください。"
        onRetry={handleRetry}
      />
    );
  }

  if (!isLoaded) {
    return <MapLoading />;
  }

  if (loadError) {
    console.error('Google Maps API読み込みエラー:', loadError);
    return (
      <MapError
        message={loadError.message || 'マップの読み込みに失敗しました'}
        details="Google Maps APIの読み込みに失敗しました。ネットワーク接続とAPIキーを確認してください。"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="mapContainer">
      <GoogleMap
        mapContainerClassName="mapContainer"
        center={defaultCenter}
        zoom={defaultZoom}
        options={mapOptions}
        onLoad={handleMapLoad}
        aria-label={MAP_ARIA_LABEL}
      >
        <MarkerList pois={pois} map={mapRef.current} selectedPoi={selectedPoi} onMarkerClick={onMarkerClick} />
      </GoogleMap>
    </div>
  );
};

MapContainer.displayName = 'MapContainer';

export default MapContainer;
