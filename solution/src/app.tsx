import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";
import type { Poi } from "./types.d.ts";

const App: React.FC = () => {
    const initialAreaVisibility = useMemo(() => {
        return Object.values(AREAS).reduce((acc, areaName) => {
            acc[areaName] = true;
            return acc;
        }, {} as Record<AreaName, boolean>);
    }, []);

    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);

    const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

    const filteredPois = useMemo(() => {
        return pois.filter(poi => areaVisibility[AREAS[poi.area]]);
    }, [pois, areaVisibility]);

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
        setAreaVisibility(prev => ({ ...prev, [areaName]: e.target.checked }));
    }, []);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>エラー: {error}</div>;

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
            <div style={{ position: "absolute", top: 100, left: 10, zIndex: 1, backgroundColor: "white", padding: 10 }}>
                {Object.entries(AREAS).map(([areaKey, areaName]) => (
                    <div key={areaKey}>
                        <input
                            type="checkbox"
                            id={areaKey} // htmlFor属性と一致させる
                            checked={areaVisibility[areaName]}
                            onChange={(e) => handleCheckboxChange(e, areaName)}
                        />
                        <label htmlFor={areaKey}>{areaName}</label> {/* htmlFor属性を修正 */}
                    </div>
                ))}
            </div>

            <Map pois={filteredPois} />
        </div>
    );
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
