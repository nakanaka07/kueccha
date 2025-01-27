import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { mapsConfig } from '../../utils/config';
import type { MapProps, Poi, AreaType } from '../../utils/types';
import { Marker } from '../marker/Marker';
import InfoWindow from '../infowindow/InfoWindow';
import HamburgerMenu from '../hamburgermenu/HamburgerMenu';
import { ERROR_MESSAGES } from '../../utils/constants';
import { INITIAL_VISIBILITY } from '../filterpanel/FilterPanel';
import resetNorthIcon from '../../utils/images/ano_icon04.png';

interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null;
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>;
  areaVisibility: Record<AreaType, boolean>;
  onLoad: () => void;
  setAreaVisibility: React.Dispatch<React.SetStateAction<Record<AreaType, boolean>>>;
}

const Map: React.FC<MapComponentProps> = ({
  pois,
  selectedPoi,
  setSelectedPoi,
  areaVisibility,
  onLoad,
  setAreaVisibility,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey,
    mapIds: [mapsConfig.mapId],
    libraries: mapsConfig.libraries,
  });
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>('roadmap');
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [localAreaVisibility, setLocalAreaVisibility] = useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);

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

  const onLoadMap = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      map.setMapTypeId('roadmap');
      map.addListener('maptypeid_changed', handleMapTypeChanged);
      onLoad();
    },
    [handleMapTypeChanged, onLoad],
  );

  const resetNorth = useCallback(() => {
    if (map) {
      map.setHeading(0);
    }
  }, [map]);

  useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      pois.forEach((poi) => {
        if (areaVisibility[poi.area]) {
          bounds.extend(poi.location);
        }
      });
      if (!isInitialRender) {
        map.fitBounds(bounds);
        map.panToBounds(bounds);
      } else {
        setIsInitialRender(false);
      }
    }
  }, [map, pois, areaVisibility, isInitialRender]);

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
    console.error('Maps API loading error:', loadError);
    return (
      <div role="alert" aria-live="assertive">
        <h2>{ERROR_MESSAGES.MAP.LOAD_FAILED}</h2>
        <p>{ERROR_MESSAGES.MAP.RETRY_MESSAGE}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return null;
  }

  return (
    <div role="region" aria-label="地図" className="map-container">
      <GoogleMap
        center={mapsConfig.defaultCenter}
        zoom={mapsConfig.defaultZoom}
        options={mapOptions}
        onLoad={onLoadMap}
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
        />
      </div>
      <button
        onClick={resetNorth}
        style={{
          position: 'absolute',
          top: '10px',
          right: '5px',
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
    </div>
  );
};

Map.displayName = 'Map';

export { Map };
export default Map;
