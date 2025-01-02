import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { CONFIG } from '../../../config';
import type { MapProps, Poi } from '../../../types';
import { Marker } from '../Marker';
import { InfoWindow } from '../InfoWindow';
import { ERROR_MESSAGES } from '../../../constants/messages';

const Map = React.memo(({ pois }: MapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: CONFIG.maps.apiKey,
    mapIds: [CONFIG.maps.mapId],
    libraries: CONFIG.maps.libraries,
  });

  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>('roadmap');

  const mapOptions = useMemo(
    () => ({
      ...CONFIG.maps.options,
      mapTypeId: mapType,
      mapTypeControl: true,
      mapTypeControlOptions: isLoaded
        ? {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
          }
        : undefined,
    }),
    [mapType, isLoaded],
  );

  const handleMapTypeChanged = useCallback(() => {
    if (map) {
      setMapType(map.getMapTypeId() as google.maps.MapTypeId);
    }
  }, [map]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      map.addListener('maptypeid_changed', handleMapTypeChanged);
    },
    [handleMapTypeChanged],
  );

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
    console.error('Maps API loading error:', loadError);
    return (
      <div role="alert" className="p-4 bg-red-100 text-red-700 rounded">
        <h2 className="font-bold mb-2">{ERROR_MESSAGES.MAP.LOAD_FAILED}</h2>
        <p>{ERROR_MESSAGES.MAP.RETRY_MESSAGE}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div role="status" className="p-4 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span>{ERROR_MESSAGES.LOADING.MAP}</span>
      </div>
    );
  }

  return (
    <div
      style={{ width: '100%', height: '100vh', position: 'relative' }}
      role="region"
      aria-label="地図"
    >
      <GoogleMap
        mapContainerStyle={CONFIG.maps.style}
        center={CONFIG.maps.defaultCenter}
        zoom={CONFIG.maps.defaultZoom}
        options={{
          ...mapOptions,
          mapId: CONFIG.maps.mapId, // ここにmapIdを追加
        }}
        onClick={handleMapClick}
        onLoad={onLoad}
      >
        {map &&
          pois.map((poi) => (
            <Marker key={poi.id} poi={poi} onClick={handleMarkerClick} map={map} />
          ))}
        {selectedPoi && <InfoWindow poi={selectedPoi} onCloseClick={handleInfoWindowClose} />}
      </GoogleMap>
    </div>
  );
});

Map.displayName = 'Map';

export { Map };
export default Map;
