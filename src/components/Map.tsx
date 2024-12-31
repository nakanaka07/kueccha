import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, useLoadScript, LoadScriptProps } from '@react-google-maps/api';
import { CONFIG } from '../config';
import type { Poi } from '../types';
import { Marker } from './Marker';
import { InfoWindow } from './InfoWindow';

const libraries: LoadScriptProps['libraries'] = ['places', 'geometry', 'drawing', 'marker'];

interface MapProps {
  pois: Poi[];
}

const Map = React.memo(({ pois }: MapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: CONFIG.maps.apiKey,
    mapIds: [CONFIG.maps.mapId],
    language: CONFIG.maps.language,
    version: CONFIG.maps.version,
    libraries,
  });

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: CONFIG.maps.style.disableDefaultUI,
      clickableIcons: CONFIG.maps.style.clickableIcons,
      mapId: CONFIG.maps.mapId,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    }),
    [],
  );

  // マップのインスタンスを保存
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // マーカーが更新されたときにマップを再描画
  useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      pois.forEach((poi) => bounds.extend(poi.location));
      map.fitBounds(bounds);
    }
  }, [map, pois]);

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
      <div role="alert" className="p-4 bg-red-100 text-red-700 rounded" aria-live="assertive">
        <h2 className="font-bold mb-2">エラーが発生しました</h2>
        <p>マップの読み込みに失敗しました。しばらく経ってから再度お試しください。</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div role="status" className="p-4 flex items-center justify-center" aria-live="polite">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span>マップを読み込んでいます...</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh' }} role="region" aria-label="地図">
      <GoogleMap
        center={CONFIG.maps.defaultCenter}
        zoom={CONFIG.maps.defaultZoom}
        options={mapOptions}
        onClick={handleMapClick}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        onLoad={onLoad}
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
