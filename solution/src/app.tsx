import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { GoogleMap, useLoadScript, InfoWindow } from "@react-google-maps/api";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import type { Poi } from "./types.js";
import { useSheetData } from "./useSheetData.js";

// Constants and Utilities
const isValidHttpUrl = (string: string) => {
  try {
    return Boolean(new URL(string));
  } catch {
    return false;
  }
};

// Area Definitions
const AREAS = {
  RYOTSU_AIKAWA: "両津・相川地区",
  KANAI_AREA: "金井・佐和田・新穂・畑野・真野地区",
  AKADOMARI_AREA: "赤泊・羽茂・小木地区",
  SNACK: "スナック",
  PUBLIC_TOILET: "公共トイレ",
  PARKING: "駐車場",
} as const;

type AreaType = (typeof AREAS)[keyof typeof AREAS];

const AREA_COLORS: Record<AreaType, string> = {
  [AREAS.RYOTSU_AIKAWA]: "#FBBC04",
  [AREAS.KANAI_AREA]: "#00ff40",
  [AREAS.AKADOMARI_AREA]: "#FFFFFF",
  [AREAS.SNACK]: "#ff0080",
  [AREAS.PUBLIC_TOILET]: "#00ffff",
  [AREAS.PARKING]: "#c0c0c0",
} as const;

// Map Configuration
const MAP_CONFIG = {
  mapContainerStyle: { width: "100%", height: "100vh" },
  defaultCenter: { lat: 38, lng: 138.5 },
  defaultZoom: 10,
  clustererOptions: {
    radius: 60,
    maxZoom: 15,
    minPoints: 2,
  },
} as const;

const isSamePosition = (pos1: google.maps.LatLngLiteral, pos2: google.maps.LatLngLiteral) => {
  return pos1.lat === pos2.lat && pos1.lng === pos2.lng;
};

const InfoWindowContentMemo = memo(({ poi }: { poi: Poi }) => {
  console.log("InfoWindowContentMemo rendered", poi);
  const businessHours = [
    { day: "月", hours: poi.monday },
    { day: "火", hours: poi.tuesday },
    { day: "水", hours: poi.wednesday },
    { day: "木", hours: poi.thursday },
    { day: "金", hours: poi.friday },
    { day: "土", hours: poi.saturday },
    { day: "日", hours: poi.sunday },
    { day: "祝", hours: poi.holiday },
  ];

  const additionalInfo = [
    { label: "補足", value: poi.description },
    { label: "予約", value: poi.reservation },
    { label: "支払い", value: poi.payment },
    { label: "電話番号", value: poi.phone },
    { label: "住所", value: poi.address },
  ];

  return (
    <div className="info-window">
      <h3>{poi.name}</h3>
      <div className="business-hours">
        {businessHours.map(({ day, hours }) => (
          <div key={day} className="hours-row">
            <span className="day">{day}</span>
            <span className="hours">{hours}</span>
          </div>
        ))}
      </div>
      <div className="additional-info">
        {additionalInfo.map(({ label, value }) => value && (
          <div key={label} className="info-row">
            <span className="label">{label}:</span>
            <span className="value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const Map = memo(({ pois }: { pois: Poi[] }) => {
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
    console.log("Map useEffect called", pois, map);

    if (!map || !google.maps?.marker?.AdvancedMarkerElement) return;

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

            const marker = new google.maps.marker.AdvancedMarkerElement({ // マーカーをここで作成
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

            return marker; // 作成したマーカーを返す
        },
      },
    });

    return cleanup;

  }, [pois, map, handleMarkerClick]);

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

const MapMemo = memo(Map);

const App = () => {
  console.log("App rendered");
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
    mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
  });

  const areas = useMemo(() => Object.values(AREAS), []);
  const { pois: fetchedPois, isLoading, error } = useSheetData(areas);

  const pois = useMemo(() => {
    console.log("pois memo recalculated", isLoading, fetchedPois);
    return isLoading ? [] : fetchedPois;
  }, [isLoading, fetchedPois]);

  if (!isLoaded || isLoading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (loadError || error) {
    return (
      <div className="error-container">
        <div>Error: {loadError?.message || error}</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <MapMemo pois={pois} />
      </div>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
