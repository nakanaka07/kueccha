// Map.tsx
import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import { GoogleMap, InfoWindow } from "@react-google-maps/api";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import type { Poi } from "./types.d.ts";
import { AREAS, AREA_COLORS, MAP_CONFIG, isSamePosition, AreaType } from "./app"; // Import AreaType
import InfoWindowContentMemo from "./InfoWindowContent";

export const Map = memo(({ pois, isLoading }: { pois: Poi[]; isLoading: boolean }) => {
  console.log("Map rendered", pois);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
  console.log("activeMarker updated:", activeMarker);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const handleMarkerClick = useCallback((poi: Poi) => {
    console.log("handleMarkerClick called", poi);
    setActiveMarker(poi);
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    console.log("handleMapLoad called", map);
    setMap(map);
    mapRef.current = map;
  }, []);

  useEffect(() => {
    console.log("Map useEffect called", pois, map, isLoading);

    if (isLoading || !map || !google.maps?.marker?.AdvancedMarkerElement) return;

    const cleanup = () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      markersRef.current.forEach((marker) => marker.map = null);
      markersRef.current = [];
    };

    if (pois.length === 0) {
      cleanup();
      return;
    }

    cleanup();

    const markers = pois.map((poi) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: poi.location.lat, lng: poi.location.lng },
        map,
        title: poi.name,
      });

      (marker as any).poiData = poi;

      marker.addListener("click", () => handleMarkerClick(poi));
      return marker;
    });

    markersRef.current = markers;

    const algorithm = new SuperClusterAlgorithm(MAP_CONFIG.clustererOptions);
    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      algorithm,
      renderer: {
        render: ({ count, position }) => {
          const positionLiteral = position instanceof google.maps.LatLng
            ? { lat: position.lat(), lng: position.lng() }
            : position;

          const clusterMarkers = markers.filter((m) => {
            const markerPosition = m.position instanceof google.maps.LatLng
              ? { lat: m.position.lat(), lng: m.position.lng() }
              : m.position as google.maps.LatLngLiteral;
            return m.position && isSamePosition(markerPosition, positionLiteral);
          });

          const firstMarkerArea = pois.find((p) =>
            clusterMarkers.some((cm) => (cm as any).poiData?.name === p.name)
          )?.area as AreaType | undefined;

          const clusterColor = firstMarkerArea
            ? AREA_COLORS[firstMarkerArea]
            : "#4285f4";

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: positionLiteral,
            map,
            content: document.createElement("div"),
          });
          if (marker.content instanceof HTMLElement) {
            Object.assign(marker.content.style, {
              background: clusterColor,
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "bold",
            });
            marker.content.textContent = String(count);
          }

          return marker;
        },
      },
    });

    return cleanup;
  }, [pois, map, handleMarkerClick, isLoading]);

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
      {activeMarker && (
        <InfoWindow
          position={{ lat: activeMarker.location.lat, lng: activeMarker.location.lng }}
          onCloseClick={() => setActiveMarker(null)}
        >
          <InfoWindowContentMemo poi={activeMarker} />
        </InfoWindow>
      )}
    </GoogleMap>
  );
});


export default Map; // Map を export default する
