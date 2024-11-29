// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";
import type { Poi } from "./types.d.ts";

const App: React.FC = () => {
    const initialAreaVisibility = useMemo<Record<AreaType, boolean>>(() => {
        return (Object.keys(AREAS) as Array<keyof typeof AREAS>).reduce((acc, key) => {
            acc[key as AreaType] = true;
            return acc;
        }, {} as Record<AreaType, boolean>);
    }, []);

    const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(initialAreaVisibility);

    const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaType: AreaType) => {
        setAreaVisibility((prev) => ({ ...prev, [areaType]: e.target.checked }));
    }, []);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>エラー: {error}</div>;

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
            <div style={{ position: "absolute", top: 100, left: 10, zIndex: 1, backgroundColor: "white", padding: 10 }}>
                {Object.entries(AREAS).map(([areaType, areaName]) => (
                    <div key={areaType}>
                        <input
                            type="checkbox"
                            checked={areaVisibility[areaType as AreaType]}
                            onChange={(e) => handleCheckboxChange(e, areaType as AreaType)}
                        />
                        <label htmlFor={areaType}>{areaName}</label>
                    </div>
                ))}
            </div>

            <Map pois={pois} areaVisibility={areaVisibility} />
        </div>
    );
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
