// app.tsx
import { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import MapMemo from "./Map";
import { AREAS } from "./appConstants"; // Import what you need

const App = () => { // ... rest of App component
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

  const [mapInitialized, setMapInitialized] = useState(false);

  if (!isLoaded) {
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
      <MapMemo
        pois={pois}
        mapInitialized={mapInitialized}
        setMapInitialized={setMapInitialized}
      />
    </div>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
