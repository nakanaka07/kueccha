import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useEffect, useState, useCallback } from 'react';
import { mapsConfig } from '../../utils/config';
import { ERROR_MESSAGES, CURRENT_LOCATION_POI } from '../../utils/constants';
import resetNorthIcon from '../../utils/images/ano_icon04.png';
import recommendIcon from '../../utils/images/ano_icon_recommend.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';
import InfoWindow from '../infowindow/InfoWindow';
import LocationWarning from '../locationwarning/LocationWarning';
import { Marker } from '../marker/Marker';
import SearchResults from '../searchresults/SearchResults.module';
import type { MapComponentProps, Poi } from '../../utils/types';

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
  const [_mapType, _setMapType] = useState<google.maps.MapTypeId | string>(
    'roadmap',
  );
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const mapOptions = {
    ...mapsConfig.options,
    mapTypeId: _mapType,
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

  const toggleRecommendations = useCallback(() => {
    setAreaVisibility((prev) => ({
      ...prev,
      RECOMMEND: !prev.RECOMMEND,
    }));
  }, [setAreaVisibility]);

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
              zIndex={selectedMarkerId === poi.id ? 1000 : undefined}
            />
          ))}
        {map && currentLocation && (
          <Marker
            key="current-location-marker"
            poi={{ ...CURRENT_LOCATION_POI, location: currentLocation }}
            onClick={() => {}}
            map={map}
            isSelected={false}
            zIndex={1000}
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
      <button
        onClick={toggleRecommendations}
        style={{
          position: 'absolute',
          top: '15px',
          right: '170px',
          background: 'none',
          border: 'none',
        }}
        title="おすすめエリアの表示を切り替えます。"
      >
        <img
          src={recommendIcon}
          alt="おすすめエリアの表示を切り替え"
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
