// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";

const App = () => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
        mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
    });

    const initialAreaVisibility = Object.fromEntries(
        Object.values(AREAS).map((areaName) => [areaName, true])
    ) as Record<AreaName, boolean>;

    const [areaVisibility, setAreaVisibility] = useState<Record<AreaName, boolean>>(initialAreaVisibility);

    const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

    const filteredPois = useMemo(
        () => pois.filter((poi) => areaVisibility[AREAS[poi.area]]),
        [pois, areaVisibility]
    );

    const [mapInitialized, setMapInitialized] = useState(false);

    if (!isLoaded) return <div>Loading...</div>;

    if (loadError || error)
        return <div>エラー: {loadError?.message || error}</div>;

    if (isLoading) return <div>Loading...</div>; 


    return (
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
            <div
                style={{
                    position: "absolute",
                    top: 100,
                    left: 10,
                    zIndex: 1,
                    backgroundColor: "white",
                    padding: 10,
                }}
            >
                {Object.entries(AREAS).map(([areaKey, areaName]) => (
                    <div key={areaKey}>
                        <input
                            type="checkbox"
                            checked={areaVisibility[areaName]}
                            onChange={(e) => {
                                setAreaVisibility((prev) => ({
                                    ...prev,
                                    [areaName]: e.target.checked,
                                }));
                            }}
                        />
                        <label htmlFor={areaKey}>{areaName}</label>
                    </div>
                ))}
            </div>

            <Map
                pois={filteredPois}
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
