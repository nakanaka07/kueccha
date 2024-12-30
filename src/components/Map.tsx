import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { CONFIG } from '../config';
import type { Poi } from '../types';
import { Marker } from './Marker';
import { InfoWindow } from './InfoWindow';

console.log('Map.tsx: Initializing Map component');

interface MapProps {
  pois: Poi[];
}

const Map = React.memo(({ pois }: MapProps) => {
  console.log('Map.tsx: Rendering with POIs count:', pois.length);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: CONFIG.maps.apiKey,
    mapIds: [CONFIG.maps.mapId],
    language: CONFIG.maps.language,
    version: CONFIG.maps.version,
    libraries: CONFIG.maps.libraries,
  });

  console.log('Map.tsx: Map loading status:', { isLoaded, loadError });

  useEffect(() => {
    console.log('Map.tsx: Map initialization', {
      isLoaded,
      loadError,
      hasApiKey: !!CONFIG.maps.apiKey,
    });
    if (isLoaded) {
      console.log('Google Maps API 読み込み完了');
    }
  }, [isLoaded, loadError]);

  const handleMarkerClick = useCallback((poi: Poi) => {
    console.log('Map.tsx: Marker clicked:', poi.name);
    setSelectedPoi(poi);
  }, []);

  const handleMapClick = useCallback(() => {
    console.log('Map.tsx: Map clicked, clearing selected POI');
    setSelectedPoi(null);
  }, []);

  if (loadError) {
    console.error('Map.tsx: Error loading maps:', loadError);
    return <div>Error loading maps</div>;
  }
  if (!isLoaded) {
    console.log('Map.tsx: Maps still loading');
    return <div>Loading maps...</div>;
  }

  return (
    <div style={CONFIG.maps.style}>
      {' '}
      {/* div要素にstyleを適用 */}
      <GoogleMap
        // mapContainerStyle={CONFIG.maps.style.mapContainerStyle} 不要になったので削除
        center={CONFIG.maps.defaultCenter}
        zoom={CONFIG.maps.defaultZoom}
        options={{
          // ...CONFIG.maps.style.options, 不要になったので削除
          disableDefaultUI: CONFIG.maps.style.disableDefaultUI, // ここに移動
          clickableIcons: CONFIG.maps.style.clickableIcons, // ここに移動
          mapId: CONFIG.maps.mapId,
        }}
        onClick={handleMapClick}
      >
        {pois.map((poi) => (
          <Marker key={poi.id} poi={poi} onClick={handleMarkerClick} />
        ))}
        {selectedPoi && <InfoWindow poi={selectedPoi} onCloseClick={() => setSelectedPoi(null)} />}
      </GoogleMap>
    </div>
  );
});

Map.displayName = 'Map';

export { Map };
