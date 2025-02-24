import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './Map.module.css';
import { MapControls } from './MapControls';
import './MapControls.module.css';
import { MapError } from './MapError';
import { useMapControl } from '../../hooks/useMapControl';
import { mapsConfig, validateConfig, CONFIG } from '../../utils/config';
import { ERROR_MESSAGES, CURRENT_LOCATION_POI } from '../../utils/constants';
import { updateRecommend } from '../../utils/types';
import InfoWindow from '../infowindow/InfoWindow';
import LocationWarning from '../locationwarning/LocationWarning';
import Marker from '../marker/Marker';
import SearchResults from '../searchresults/SearchResults';
import type { MapComponentProps, Poi, AreaVisibility } from '../../utils/types';

if (!mapsConfig.apiKey || !mapsConfig.mapId) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('Configuration validation failed:', error);
  throw error;
}

export const Map: React.FC<MapComponentProps> = ({
  pois,
  selectedPoi,
  setSelectedPoi,
  areaVisibility,
  onLoad,
  setAreaVisibility,
  currentLocation,
  setCurrentLocation,
  showWarning,
  setShowWarning,
  setIsMapLoaded,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey,
    mapIds: [mapsConfig.mapId],
    libraries: mapsConfig.libraries,
    version: mapsConfig.version,
    language: mapsConfig.language,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { resetNorth, handleGetCurrentLocation: getCurrentLocation } = useMapControl(map);
  const [_mapType, _setMapType] = useState<google.maps.MapTypeId | string>('roadmap');
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    console.log('isLoaded state:', isLoaded);
    console.log('loadError state:', loadError);
    if (!isLoaded) {
      console.log('Map is loading...');
      return;
    }
    if (loadError) {
      console.error('Map load error:', loadError);
      return;
    }
    console.log('Map loaded successfully');
  }, [isLoaded, loadError]);

  useEffect(() => {
    console.log('Map component status:', {
      isLoaded,
      loadError,
      apiKey: mapsConfig.apiKey,
      mapId: mapsConfig.mapId,
    });
  }, [isLoaded, loadError]);

  useEffect(() => {
    console.log('Map component mount/update:', {
      isLoaded,
      loadError,
      map: !!map,
    });
  }, [isLoaded, loadError, map]);

  const mapOptions = useMemo(() => {
    if (!isLoaded) return {};
    return {
      ...mapsConfig.options,
      mapTypeId: _mapType,
      mapTypeControl: true,
      zoomControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_LEFT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
      },
      ...(mapsConfig.mapId ? { mapId: mapsConfig.mapId } : {}),
    };
  }, [isLoaded, _mapType]);

  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      if (mapInstance) {
        console.log('Map instance loaded successfully');
        setMap(mapInstance);
        setIsMapLoaded(mapInstance); // 直接mapInstanceを渡す
        onLoad(mapInstance);
      } else {
        console.error('Map instance is null');
      }
    },
    [onLoad, setIsMapLoaded],
  );

  const toggleRecommendations = useCallback(() => {
    console.log('Toggling recommendations');
    setAreaVisibility((prev: AreaVisibility) => updateRecommend(prev));
  }, [setAreaVisibility]);

  useEffect(() => {
    if (map) {
      console.log('Updating map bounds');
      const bounds = new google.maps.LatLngBounds();

      pois.forEach((poi) => {
        if (areaVisibility[poi.area]) {
          bounds.extend(poi.location);
        }
      });

      if (currentLocation) {
        bounds.extend(currentLocation);
      }

      const allFiltersOff = Object.values(areaVisibility).every((visible) => !visible);
      if (allFiltersOff) {
        map.setCenter(mapsConfig.defaultCenter);
        map.setZoom(mapsConfig.defaultZoom);
      } else {
        map.fitBounds(bounds);
        map.panToBounds(bounds);
        if (isInitialRender) {
          setIsInitialRender(false);
        }
      }
    }
  }, [map, pois, areaVisibility, isInitialRender, currentLocation]);

  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      console.log('Marker clicked:', poi);
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
    },
    [setSelectedPoi],
  );

  const handleInfoWindowClose = useCallback(() => {
    console.log('InfoWindow closed');
    setSelectedPoi(null);
    setSelectedMarkerId(null);
  }, [setSelectedPoi]);

  const handleSearchResultClick = useCallback(
    (poi: Poi) => {
      console.log('Search result clicked:', poi);
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
      if (map) {
        map.panTo(poi.location);
      }
    },
    [setSelectedPoi, map],
  );

  const handleGetCurrentLocation = useCallback(() => {
    console.log('Getting current location');
    getCurrentLocation({
      onSuccess: (location) => {
        console.log('Current location obtained:', location);
        setCurrentLocation(location);
        setAreaVisibility((prev: AreaVisibility) => ({
          ...prev,
          CURRENT_LOCATION: true,
        }));
        setShowWarning(true);
      },
      onError: (error) => alert(error),
    });
  }, [getCurrentLocation, setCurrentLocation, setAreaVisibility, setShowWarning]);

  if (loadError) {
    return <MapError message={ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={() => window.location.reload()} />;
  }

  if (!isLoaded) {
    return <div className="loading-container">地図を読み込んでいます...</div>;
  }

  const displayedPois = pois.filter((poi) => areaVisibility[poi.area]);

  return (
    <div role="region" aria-label="地図" className={styles.mapContainer}>
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: '100%',
        }}
        center={mapsConfig.defaultCenter}
        zoom={mapsConfig.defaultZoom}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {map &&
          displayedPois.map((poi) => (
            <Marker
              key={poi.id}
              poi={poi}
              onClick={handleMarkerClick}
              map={map}
              isSelected={selectedMarkerId === poi.id}
              zIndex={selectedMarkerId === poi.id ? 1000 : undefined}
            />
          ))}
        {map && currentLocation && (
          <Marker
            key="current-location-marker"
            poi={{
              ...CURRENT_LOCATION_POI,
              location: currentLocation,
              id: 'current-location',
              name: '現在地',
              area: 'CURRENT_LOCATION',
              category: '現在地',
              genre: '現在地',
            }}
            onClick={() => {}}
            map={map}
            isSelected={false}
            zIndex={1000}
          />
        )}
        {selectedPoi && <InfoWindow key={selectedPoi.id} poi={selectedPoi} onCloseClick={handleInfoWindowClose} />}
      </GoogleMap>
      <MapControls
        onResetNorth={resetNorth}
        onGetCurrentLocation={handleGetCurrentLocation}
        onToggleRecommendations={toggleRecommendations}
      />
      {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
      <SearchResults results={displayedPois} onResultClick={handleSearchResultClick} />
    </div>
  );
};

Map.displayName = 'Map';

export default Map;
