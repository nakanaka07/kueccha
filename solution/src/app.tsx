// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS } from "./appConstants";

const App = () => {
    console.log("App rendered");

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
        mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
    });

    const areas = useMemo(() => Object.values(AREAS), []);
    const { pois, isLoading, error } = useSheetData(areas);

    const [mapInitialized, setMapInitialized] = useState(false);

    if (!isLoaded) return <div>Loading...</div>; // マップロード中はローディングメッセージ

    if (loadError || error) {
        return <div>エラー: {loadError?.message || error}</div>; // エラーメッセージ
    }

    return (
        <div style={{ width: "100%", height: "100vh" }}>
            <Map pois={pois} mapInitialized={mapInitialized} setMapInitialized={setMapInitialized} />
        </div>
    );
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
