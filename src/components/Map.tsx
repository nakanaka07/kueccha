import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useRef, useState } from 'react';

import MapError from './MapError';
import { ERROR_MESSAGES, MAPS_CONFIG } from '../../utils/constants';
import { MapComponentProps } from '../../utils/types';

if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

const MAP_ARIA_LABEL = '地図コンテンツ';
const LOADING_ARIA_LABEL = '地図読み込み中';

export const Map: React.FC<MapComponentProps> = ({ onLoad, setIsMapLoaded }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey,
    mapIds: [MAPS_CONFIG.mapId],
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
      if (setIsMapLoaded) {
        setIsMapLoaded(map);
      }
    },
    [onLoad, setIsMapLoaded],
  );

  const handleRetry = useCallback(() => {
    setMapError(null);
    window.location.reload();
  }, []);

  if (!isLoaded) {
    return (
      <div aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
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
    <div>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
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

Map.displayName = 'Map';
export default Map;
