import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { CONFIG } from '../config';
import type { Poi } from '../types';
import { Marker } from './Marker';
import { InfoWindow } from './InfoWindow';

interface MapProps {
  pois: Poi[];
}

const Map = React.memo(({ pois }: MapProps) => {
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: CONFIG.maps.apiKey,
    mapIds: [CONFIG.maps.mapId],
    language: CONFIG.maps.language,
    version: CONFIG.maps.version,
    libraries: CONFIG.maps.libraries,
  });

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: CONFIG.maps.style.disableDefaultUI,
      clickableIcons: CONFIG.maps.style.clickableIcons,
      mapId: CONFIG.maps.mapId,
    }),
    [],
  );

  const handleMarkerClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  if (loadError) {
    return (
      <div role="alert" className="p-4 bg-red-100 text-red-700 rounded">
        マップの読み込みに失敗しました。しばらく経ってから再度お試しください。
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div role="status" className="p-4 flex items-center justify-center">
        <span className="mr-2">マップを読み込んでいます...</span>
      </div>
    );
  }

  return (
    <div style={CONFIG.maps.style} role="region" aria-label="地図">
      <GoogleMap
        center={CONFIG.maps.defaultCenter}
        zoom={CONFIG.maps.defaultZoom}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {pois.map((poi) => (
          <Marker key={poi.id} poi={poi} onClick={handleMarkerClick} />
        ))}
        {selectedPoi && <InfoWindow poi={selectedPoi} onCloseClick={handleInfoWindowClose} />}
      </GoogleMap>
    </div>
  );
});

Map.displayName = 'Map';

export { Map };
export default Map;