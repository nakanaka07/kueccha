import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { mapsConfig } from '../../utils/config';
import type { MapProps, Poi, AreaType } from '../../utils/types';
import { Marker } from '../marker/Marker';
import { InfoWindow } from '../infowindow/InfoWindow';
import { ERROR_MESSAGES } from '../../utils/constants';
import './Map.css';

interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null;
  setSelectedPoi: (poi: Poi | null) => void;
  areaVisibility: Record<AreaType, boolean>;
}

const Map: React.FC<MapComponentProps> = ({
  pois,
  selectedPoi,
  setSelectedPoi,
  areaVisibility,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey,
    mapIds: [mapsConfig.mapId],
    libraries: mapsConfig.libraries,
  });
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>('roadmap');

  const mapOptions = {
    ...mapsConfig.options,
    mapTypeId: mapType,
    mapTypeControl: true,
    zoomControl: true,
    mapTypeControlOptions: isLoaded
      ? {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
        }
      : undefined,
  };

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

  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
    },
    [setSelectedPoi],
  );

  const handleMapClick = useCallback(() => {
    setSelectedPoi(null);
  }, [setSelectedPoi]);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, [setSelectedPoi]);

  if (loadError) {
    console.error('Maps API loading error:', loadError);
    return (
      <div role="alert" aria-live="assertive">
        <h2>{ERROR_MESSAGES.MAP.LOAD_FAILED}</h2>
        <p>{ERROR_MESSAGES.MAP.RETRY_MESSAGE}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div role="status" aria-live="polite">
        <div />
        <span>{ERROR_MESSAGES.LOADING.MAP}</span>
      </div>
    );
  }

  return (
    <div role="region" aria-label="地図" className="map-container">
      <GoogleMap
        center={mapsConfig.defaultCenter}
        zoom={mapsConfig.defaultZoom}
        options={{
          ...mapOptions,
          mapId: mapsConfig.mapId,
        }}
        onClick={handleMapClick}
        onLoad={onLoad}
      >
        {map &&
          pois
            .filter((poi) => areaVisibility[poi.area])
            .map((poi) => <Marker key={poi.id} poi={poi} onClick={handleMarkerClick} map={map} />)}
        {selectedPoi && <InfoWindow poi={selectedPoi} onCloseClick={handleInfoWindowClose} />}
      </GoogleMap>
    </div>
  );
};

Map.displayName = 'Map';

export { Map };
export default Map;
