// src/app.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef, CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import loadingImage from "./row1.png";


const App: React.FC = () => {
    const initialAreaVisibility = useMemo(() => {
        const initialVisibility: Record<AreaType, boolean> = {} as any;
        for (const areaName in AREAS) {
            initialVisibility[areaName as AreaType] = true;
        }
        return initialVisibility;
    }, []);


    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);
    const { pois, isLoading } = useSheetData();
    const filteredPois = useMemo(
        () => pois.filter((poi) => areaVisibility[poi.area]),
        [pois, areaVisibility]
    );

    console.log("App component rendered. Filtered POIs:", filteredPois);

    const handleCheckboxChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>, areaType: AreaType) => {
            setAreaVisibility((prev) => ({ ...prev, [areaType]: e.target.checked }));
        },
        []
    );

    const handleMarkerClick = useCallback((areaType: AreaType) => {
        setAreaVisibility((prev) => ({
            ...prev,
            [areaType]: !prev[areaType],
        }));
    }, []);

    const [isCheckboxVisible, setIsCheckboxVisible] = useState(true);
    const checkboxAreaClassName = isCheckboxVisible
        ? "checkbox-area visible"
        : "checkbox-area hidden";

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

    const mapContainerStyle: CSSProperties = {
        opacity: isLoading ? 0 : 1,
        transition: "opacity 0.5s ease-in-out",
        width: "100%",
        height: "100%",
        position: "relative" as "relative", // positionプロパティをキャスト
    };

	const loadingOverlayStyle: CSSProperties = {
        position: "absolute" as "absolute", // positionプロパティをキャスト
			top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        zIndex: 2,
    };


    const checkboxAreaStyle: CSSProperties = {
        position: "absolute" as "absolute", // positionプロパティをキャスト
        top: 120, // 数値で指定
        left: 10,  // 数値で指定
        zIndex: 1,
        backgroundColor: "white",
        padding: "10px", // 文字列リテラルで指定
    };

    const checkboxLabelStyle = {
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        marginBottom: "5px",
    };

    const checkboxSpanStyle = (areaType: AreaType) => ({
        display: "inline-block",
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        backgroundColor: filteredPois.some(poi => poi.area === areaType)
            ? AREA_COLORS[areaType] || defaultMarkerColor
            : "gray",
        marginRight: "5px",
        border: "1px solid white",
        opacity: areaVisibility[areaType] ? 1 : 0.5,
        cursor: "pointer",
    });

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            <div ref={mapContainerRef} style={mapContainerStyle}>
                <Map pois={filteredPois} />

                <button
                    onClick={() => setIsCheckboxVisible(prev => !prev)}
                    style={{ position: "absolute", top: "90px", left: "10px", zIndex: 2 }}
                >
                    {isCheckboxVisible ? "チェックボックスを隠す" : "チェックボックスを表示"}
                </button>

                <div className={checkboxAreaClassName} style={checkboxAreaStyle}>
                    {Object.entries(AREAS).map(([areaType, areaName]) => (
                        <label
                            key={areaType}
                            htmlFor={`checkbox-${areaType}`}
                            style={checkboxLabelStyle}
                        >
                            <span
                                style={checkboxSpanStyle(areaType as AreaType)}
                                onClick={() => handleMarkerClick(areaType as AreaType)}
                            />
                            <input
                                type="checkbox"
                                id={`checkbox-${areaType}`}
                                checked={areaVisibility[areaType as AreaType]}
                                onChange={(e) => handleCheckboxChange(e, areaType as AreaType)}
                            />
                            {areaName}
                        </label>
                    ))}
                </div>
            </div>

            {isLoading && (
                <div style={loadingOverlayStyle}>
                    <img src={loadingImage} alt="Loading..." style={{ maxWidth: "80vw" }} />
                </div>
            )}
        </div>
    );
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
