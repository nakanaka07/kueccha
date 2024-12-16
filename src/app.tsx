// src/app.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import { useJsApiLoader } from "@react-google-maps/api";
import loadingImage from "./row1.png";

const App: React.FC = () => {
    const { isLoaded: apiLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ["marker"],
        mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID],
        version: "weekly",
        language: "ja",
    });

    const { pois, isLoading, error, retry } = useSheetData();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(apiLoaded && !isLoading);
    }, [apiLoaded, isLoading]);

    const initialAreaVisibility = useMemo(() => {
        const initialVisibility: Record<AreaType, boolean> = {} as any;
        for (const areaName in AREAS) {
            initialVisibility[areaName as AreaType] = true;
        }
        return initialVisibility;
    }, []);

    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);
    const filteredPois = useMemo(() => pois.filter(poi => areaVisibility[poi.area]), [pois, areaVisibility]);

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaType: AreaType) => {
        setAreaVisibility(prev => ({ ...prev, [areaType]: e.target.checked }));
    }, []);

    const handleMarkerClick = useCallback((areaType: AreaType) => {
        setAreaVisibility(prev => ({ ...prev, [areaType]: !prev[areaType] }));
    }, []);


    const [isCheckboxVisible, setIsCheckboxVisible] = useState(true);
    const checkboxAreaClassName = isCheckboxVisible ? "checkbox-area visible" : "checkbox-area hidden";
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        if (!isLoading && mapContainerRef.current) {
            timer = setTimeout(() => {
                mapContainerRef.current!.style.opacity = "1";
            }, 500);
        }
        return () => clearTimeout(timer);
    }, [isLoading, mapContainerRef]);


    if (error) {
        return <div>エラーが発生しました：{error.message}<button onClick={retry}>再試行</button></div>;
    }

    if (!isLoaded) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <img src={loadingImage} alt="Loading..." style={{ width: "20%", minWidth: "200px", maxWidth: "80vw" }} />
    </div>;



    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            <div
                ref={mapContainerRef}
                style={{
                    opacity: 0,
                    transition: "opacity 0.5s ease-in-out",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
<Map pois={filteredPois} isLoaded={isLoaded} setIsLoaded={setIsLoaded}/>

<button
    onClick={() => setIsCheckboxVisible((prev) => !prev)}
    style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}
>
    {isCheckboxVisible ? "チェックボックスを隠す" : "チェックボックスを表示"}
</button>

<div className={checkboxAreaClassName}
     style={{ position: "absolute", top:"40px", left: "10px", zIndex: 1, backgroundColor: "white", padding: "10px" }}>
    {Object.entries(AREAS).map(([areaType, areaName]) => (
        <label key={areaType} htmlFor={`checkbox-${areaType}`} style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: "5px" }}>
            <span
                style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: filteredPois.some(poi => poi.area === areaType)
                        ? AREA_COLORS[areaType as AreaType] || defaultMarkerColor
                        : "gray",
                    marginRight: "5px",
                    border: "1px solid white",
                    opacity: areaVisibility[areaType as AreaType] ? 1 : 0.5,
                    cursor: "pointer",
                }}
                onClick={() => handleMarkerClick(areaType as AreaType)}
            />
            <input
                type="checkbox"
                id={`checkbox-${areaType}`}
                checked={areaVisibility[areaType as AreaType]}
                onChange={e => handleCheckboxChange(e, areaType as AreaType)}
            />
            {areaName} ({filteredPois.filter(poi => poi.area === areaType).length})
        </label>
    ))}
</div>
</div>

{isLoading && (
<div style={{
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    zIndex: 2
}}>
    <img src={loadingImage} alt="Loading..." style={{ maxWidth: "80vw" }} />
</div>
)}
</div>
    )
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
