import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { mapsConfig } from '../../utils/config';
import type { MapProps, Poi, AreaType, LatLngLiteral } from '../../utils/types';
import { Marker } from '../marker/Marker';
import InfoWindow from '../infowindow/InfoWindow';
import HamburgerMenu from '../hamburgermenu/HamburgerMenu';
import LocationWarning from '../locationwarning/LocationWarning';
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
  showWarning: boolean; // 追加
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>; // 追加
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
  showWarning, // 追加
  setShowWarning, // 追加
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

  const handleMapTypeChanged = useCallback(() => {
    if (map) {
      setMapType(map.getMapTypeId() as google.maps.MapTypeId);
    }
  }, [map]);

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
      setLocalAreaVisibility((prev) => ({
        ...prev,
        CURRENT_LOCATION: false,
      }));
      setShowWarning(false); // 現在地をオフにした際に警告メッセージを閉じる
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            setLocalAreaVisibility((prev) => ({
              ...prev,
              CURRENT_LOCATION: true,
            }));
            setShowWarning(true); // 現在地が取得されたときに警告メッセージを表示
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
  }, [
    currentLocation,
    setCurrentLocation,
    setLocalAreaVisibility,
    setShowWarning,
  ]);

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
        if (!isInitialRender) {
          map.fitBounds(bounds);
          map.panToBounds(bounds);
        } else {
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

  if (loadError) {
    return <div>{ERROR_MESSAGES.MAP.LOAD_FAILED}</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div role="region" aria-label="地図" className="map-container">
      <GoogleMap
        center={mapsConfig.defaultCenter}
        zoom={mapsConfig.defaultZoom}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {map &&
          pois
            .filter((poi) => areaVisibility[poi.area])
            .map((poi) => (
              <Marker
                key={poi.id}
                poi={poi}
                onClick={handleMarkerClick}
                map={map}
                isSelected={selectedMarkerId === poi.id}
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
            }}
            onClick={() => {}}
            map={map}
            isSelected={false}
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
      <div className="hamburger-menu-container">
        <HamburgerMenu
          pois={pois}
          setSelectedPoi={setSelectedPoi}
          setAreaVisibility={setAreaVisibility}
          localAreaVisibility={localAreaVisibility}
          setLocalAreaVisibility={setLocalAreaVisibility}
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
          setShowWarning={setShowWarning} // 追加
        />
      </div>
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
    </div>
  );
};

Map.displayName = 'Map';

export { Map };
export default Map;
