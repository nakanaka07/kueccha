import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useRef, useState } from 'react';
import styles from './Map.module.css';
import MapError from './MapError';
import { ERROR_MESSAGES, MAPS_CONFIG } from '../../utils/constants';
import { MapComponentProps, Poi, AreaType } from '../../utils/types';
import { Marker } from '../marker/Marker';

if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

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

interface ExtendedMapProps extends MapComponentProps {
  pois?: Poi[];
  selectedPoi?: Poi | null;
  onMarkerClick?: (poi: Poi) => void;
}

export const Map: React.FC<ExtendedMapProps> = ({
  onLoad,
  pois = [],
  selectedPoi = null,
  onMarkerClick = () => {},
}) => {
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
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          disableDoubleClickZoom: false,
          scrollwheel: true,
          clickableIcons: true,
          gestureHandling: 'cooperative',
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: 2,
            position: 1,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: 3,
          },
          zoomControl: true,
          zoomControlOptions: {
            position: 7,
          },
          streetViewControl: true,
          streetViewControlOptions: {
            position: 7,
          },
          cameraControl: true,
          cameraControlOptions: {
            position: 7,
          },
        }}
        onLoad={handleMapLoad}
        aria-label={MAP_ARIA_LABEL}
      >
        {mapRef.current &&
          pois.map((poi) => (
            <Marker
              key={poi.id}
              poi={poi}
              map={mapRef.current}
              onClick={onMarkerClick}
              isSelected={selectedPoi?.id === poi.id}
              zIndex={getMarkerZIndex(poi.area)}
            />
          ))}
      </GoogleMap>
    </div>
  );
};

Map.displayName = 'Map';

export default Map;
