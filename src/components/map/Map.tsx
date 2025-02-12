import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { mapsConfig } from '../../utils/config';
import type { MapProps, Poi, AreaType, LatLngLiteral } from '../../utils/types';
import { Marker } from '../marker/Marker';
import InfoWindow from '../infowindow/InfoWindow';
import LocationWarning from '../locationwarning/LocationWarning';
import SearchResults from '../searchresults/SearchResults';
import { ERROR_MESSAGES } from '../../utils/constants';
import { INITIAL_VISIBILITY } from '../filterpanel/FilterPanel';
import resetNorthIcon from '../../utils/images/ano_icon04.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';

interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null;
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  areaVisibility: Record<AreaType, boolean>;
  onLoad: () => void;
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >;
  currentLocation: LatLngLiteral | null;
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >;
  showWarning: boolean;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

const Map: React.FC<MapComponentProps> = ({
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
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey,
    mapIds: [mapsConfig.mapId],
    libraries: mapsConfig.libraries,
  });
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>(
    'roadmap',
  );
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [localAreaVisibility, setLocalAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);

  const mapOptions = {
    ...mapsConfig.options,
    mapTypeId: mapType,
    mapTypeControl: true,
    zoomControl: true,
    mapTypeControlOptions: isLoaded
      ? {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_LEFT,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
        }
      : undefined,
    ...(mapsConfig.mapId ? { mapId: mapsConfig.mapId } : {}),
  };

  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      onLoad();
    },
    [onLoad],
  );

  const resetNorth = useCallback(() => {
    if (map) {
      map.setHeading(0);
    }
  }, [map]);

  const handleGetCurrentLocation = useCallback(() => {
    if (currentLocation) {
      setCurrentLocation(null);
      setAreaVisibility((prev) => ({
        ...prev,
        CURRENT_LOCATION: false,
      }));
      setShowWarning(false);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            setAreaVisibility((prev) => ({
              ...prev,
              CURRENT_LOCATION: true,
            }));
            setShowWarning(true);
          },
          (error) => {
            console.error('Error getting current location:', error);
            alert('現在地の取得に失敗しました。');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      } else {
        alert('このブラウザは現在地取得に対応していません。');
      }
    }
  }, [currentLocation, setCurrentLocation, setAreaVisibility, setShowWarning]);

  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();

      pois.forEach((poi) => {
        if (areaVisibility[poi.area]) {
          bounds.extend(poi.location);
        }
      });

      if (currentLocation) {
        bounds.extend(currentLocation);
      }

      const allFiltersOff = Object.values(areaVisibility).every(
        (visible) => !visible,
      );
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
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
    },
    [setSelectedPoi],
  );

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
    setSelectedMarkerId(null);
  }, [setSelectedPoi]);

  const handleSearchResultClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
      if (map) {
        map.panTo(poi.location);
      }
    },
    [setSelectedPoi, map],
  );

  if (loadError) {
    return <div>{ERROR_MESSAGES.MAP.LOAD_FAILED}</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const displayedPois = pois.filter((poi) => areaVisibility[poi.area]);

  return (
    <div role="region" aria-label="地図" className="map-container">
      <GoogleMap
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
              zIndex={selectedMarkerId === poi.id ? 1000 : undefined} // 選択されたマーカーを最前面に表示
            />
          ))}
        {map && currentLocation && (
          <Marker
            key="current-location-marker"
            poi={{
              id: 'current-location',
              name: '現在地',
              location: currentLocation,
              area: 'CURRENT_LOCATION',
              category: '現在地',
              genre: '', // 必要なプロパティを追加
              monday: '', // 必要なプロパティを追加
              tuesday: '', // 必要なプロパティを追加
              wednesday: '', // 必要なプロパティを追加
              thursday: '', // 必要なプロパティを追加
              friday: '', // 必要なプロパティを追加
              saturday: '', // 必要なプロパティを追加
              sunday: '', // 必要なプロパティを追加
              holiday: '', // 必要なプロパティを追加
              holidayInfo: '', // 必要なプロパティを追加
              information: '', // 必要なプロパティを追加
              view: '', // 必要なプロパティを追加
              phone: '', // 必要なプロパティを追加
              address: '', // 必要なプロパティを追加
              parking: '', // 必要なプロパティを追加
              payment: '', // 必要なプロパティを追加
            }}
            onClick={() => {}}
            map={map}
            isSelected={false}
            zIndex={999} // 現在地のマーカーを他のマーカーより前面に表示
          />
        )}
        {selectedPoi && (
          <InfoWindow
            key={selectedPoi.id}
            poi={selectedPoi}
            onCloseClick={handleInfoWindowClose}
          />
        )}
      </GoogleMap>
      <button
        onClick={resetNorth}
        style={{
          position: 'absolute',
          top: '15px',
          right: '50px',
          background: 'none',
          border: 'none',
        }}
        title="北向きにリセットします。"
      >
        <img
          src={resetNorthIcon}
          alt="北向きにリセット"
          style={{ width: '50px', height: '50px' }}
        />
      </button>
      <button
        onClick={handleGetCurrentLocation}
        style={{
          position: 'absolute',
          top: '15px',
          right: '110px',
          background: 'none',
          border: 'none',
        }}
        title="現在地を取得します。"
      >
        <img
          src={currentLocationIcon}
          alt="現在地を取得"
          style={{ width: '50px', height: '50px' }}
        />
      </button>
      {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
      <SearchResults
        results={displayedPois}
        onResultClick={handleSearchResultClick}
      />
    </div>
  );
};

Map.displayName = 'Map';

export { Map };
export default Map;
