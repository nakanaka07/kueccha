// app.tsx
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import MapMemo from "./Map"; // Map コンポーネントをインポート


// Constants and Utilities
const isValidHttpUrl = (string: string) => {
  try {
    return Boolean(new URL(string));
  } catch {
    return false;
  }
};

// Area Definitions
export const AREAS = { // Add 'export' keyword here
  RYOTSU_AIKAWA: "両津・相川地区",
  KANAI_AREA: "金井・佐和田・新穂・畑野・真野地区",
  AKADOMARI_AREA: "赤泊・羽茂・小木地区",
  SNACK: "スナック",
  PUBLIC_TOILET: "公共トイレ",
  PARKING: "駐車場",
} as const;

export type AreaType = (typeof AREAS)[keyof typeof AREAS]; // Define AreaType

export const AREA_COLORS = { // Add 'export' keyword
  [AREAS.RYOTSU_AIKAWA]: "#4285f4", // 青
  [AREAS.KANAI_AREA]: "#34A853", // 緑
  [AREAS.AKADOMARI_AREA]: "#EA4335", // 赤
  [AREAS.SNACK]: "#FBBC05", // 黄色
  [AREAS.PUBLIC_TOILET]: "#000000", // 黒
  [AREAS.PARKING]: "#999999", // グレー
} as const;

export const MAP_CONFIG = { // Add 'export' keyword
  defaultCenter: { lat: 39.3647077, lng: 138.3275003 },
  defaultZoom: 11,
  mapContainerStyle: {
    width: "100%",
    height: "100%",
  },
  clustererOptions: {
    minClusterSize: 4,
    maxZoom: 16,
    radius: 40,
  },
};

export const isSamePosition = (
  pos1: google.maps.LatLngLiteral,
  pos2: google.maps.LatLngLiteral,
): boolean => {
  return pos1.lat === pos2.lat && pos1.lng === pos2.lng;
};



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
    return <div>Loading...</div>;
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
      <MapMemo pois={pois} isLoading={isLoading} />
    </div>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
