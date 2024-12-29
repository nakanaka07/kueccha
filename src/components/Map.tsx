import React, { useState, useCallback } from 'react';
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

  const handleMarkerClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={CONFIG.maps.style.mapContainerStyle}
      center={CONFIG.maps.defaultCenter}
      zoom={CONFIG.maps.defaultZoom}
      options={{
        ...CONFIG.maps.style.options,
        mapId: CONFIG.maps.mapId,
      }}
      onClick={handleMapClick}
    >
      {pois.map((poi) => (
        <Marker key={poi.id} poi={poi} onClick={handleMarkerClick} />
      ))}
      {selectedPoi && (
        <InfoWindow position={selectedPoi.location} onCloseClick={() => setSelectedPoi(null)}>
          <div>
            <InfoWindow poi={selectedPoi} />
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
});

Map.displayName = 'Map';

export { Map };
