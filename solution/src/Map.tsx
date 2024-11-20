// Map.tsx
import React, { useState, useCallback, useEffect, memo } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { MarkerClusterer } from "@react-google-maps/marker-clusterer";
import type { Poi } from "./types.d.ts";
import { AREAS, AREA_COLORS, MAP_CONFIG, isSamePosition, AreaType } from "./app";
import InfoWindowContentMemo from "./InfoWindowContent";

type ClustererComponent = ReturnType<typeof MarkerClusterer>;

export const Map = memo(
  ({ pois, isLoading }: { pois: Poi[]; isLoading: boolean }) => {
    console.log("Map rendered", pois);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
    console.log("activeMarker updated:", activeMarker);

    const handleMarkerClick = useCallback((poi: Poi) => {
      console.log("handleMarkerClick called", poi);
      setActiveMarker(poi);
    }, []);

    const handleMapLoad = useCallback((map: google.maps.Map) => {
      console.log("handleMapLoad called", map);
      setMap(map);
    }, []);

    useEffect(() => {
      console.log("Map useEffect called", pois, map, isLoading);

      if (isLoading || !map) return;

      return () => {};
    }, [pois, map, isLoading]);

    return (
      <GoogleMap
        onLoad={handleMapLoad}
        mapContainerStyle={MAP_CONFIG.mapContainerStyle}
        center={MAP_CONFIG.defaultCenter}
        zoom={MAP_CONFIG.defaultZoom}
        options={{
          mapId: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        <MarkerClusterer options={MAP_CONFIG.clustererOptions}>
          {(clusterer: ClustererComponent) =>
            pois.map((poi) => (
              <Marker
                key={poi.name}
                position={{ lat: poi.location.lat, lng: poi.location.lng }}
                title={poi.name}
                onClick={() => handleMarkerClick(poi)}
                clusterer={clusterer}
              />
            ))
          }
        </MarkerClusterer>

        {activeMarker && (
          <InfoWindow
            position={{
              lat: activeMarker.location.lat,
              lng: activeMarker.location.lng,
            }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <InfoWindowContentMemo poi={activeMarker} />
          </InfoWindow>
        )}
      </GoogleMap>
    );
  }
);

export default Map;
