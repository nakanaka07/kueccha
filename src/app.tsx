// src/app.tsx
import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import loadingImage from "./row1.png";
import { LoadScript } from "@react-google-maps/api";

// 必要なGoogle Maps APIのライブラリを指定

const App: React.FC = () => {
    const { pois, isLoading, error, retry } = useSheetData();

    const initialAreaVisibility = useMemo(() => {
        return Object.keys(AREAS).reduce((acc, area) => {
            acc[area as AreaType] = true;
            return acc;
        }, {} as Record<AreaType, boolean>);
    }, []);

    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);

    const filteredPois = useMemo(
        () => pois.filter(poi => areaVisibility[poi.area]),
        [pois, areaVisibility]
    );

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaType: AreaType) => {
        setAreaVisibility(prev => ({ ...prev, [areaType]: e.target.checked }));
    }, []);

    const handleMarkerClick = useCallback((areaType: AreaType) => {
        setAreaVisibility(prev => ({ ...prev, [areaType]: !prev[areaType] }));
    }, []);

    const [isCheckboxVisible, setIsCheckboxVisible] = useState(true);
    const checkboxAreaClassName = isCheckboxVisible ? "checkbox-area visible" : "checkbox-area hidden";

    if (error) {
        return (
            <div>
                <p>エラーが発生しました：{error.message}</p>
                <button onClick={retry}>再試行</button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <img src={loadingImage} alt="Loading..." style={{ width: "20%", minWidth: "200px", maxWidth: "80vw" }} />
            </div>
        );
    }

    return (
        <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={["marker"]} // Libraries型の値を使用
            id="google-map-script"
            mapIds={[import.meta.env.VITE_GOOGLE_MAPS_MAP_ID]}
            version="weekly"
            language="ja"
        >
            <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                    <Map pois={filteredPois} />

                    {/* チェックボックス表示切り替えボタン */}
                    <button
                        onClick={() => setIsCheckboxVisible(!isCheckboxVisible)}
                        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}
                    >
                        {isCheckboxVisible ? "チェックボックスを隠す" : "チェックボックスを表示"}
                    </button>

                    {/* チェックボックスエリア */}
                    <div className={checkboxAreaClassName} style={{ position: "absolute", top: "40px", left: "10px", zIndex: 1, backgroundColor: "white", padding: "10px" }}>
                        {Object.entries(AREAS).map(([areaType, areaName]) => (
                            <label key={areaType} htmlFor={`checkbox-${areaType}`} style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "5px" }}>
                                {/* マーカーの色を表示する丸 */}
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "50%",
                                        backgroundColor: filteredPois.some(poi => poi.area === areaType) ? AREA_COLORS[areaType as AreaType] || defaultMarkerColor : "gray",
                                        marginRight: "5px",
                                        border: "1px solid white",
                                        opacity: areaVisibility[areaType as AreaType] ? 1 : 0.5,
                                        cursor: "pointer"
                                    }}
                                    onClick={() => handleMarkerClick(areaType as AreaType)}
                                />
                                {/* チェックボックス */}
                                <input
                                    type="checkbox"
                                    id={`checkbox-${areaType}`}
                                    checked={areaVisibility[areaType as AreaType]}
                                    onChange={(e) => handleCheckboxChange(e, areaType as AreaType)}
                                />
                                {/* エリア名とPOI数 */}
                                {areaName} ({filteredPois.filter(poi => poi.area === areaType).length})
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </LoadScript>
    );
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
