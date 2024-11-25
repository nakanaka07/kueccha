// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS } from "./appConstants";
import type { AreaType } from "./appConstants"; // AreaTypeをインポート


const App = () => {

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
        mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
    });

    const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>({
        [AREAS.RYOTSU_AIKAWA]: true,
        [AREAS.KANAI_AREA]: true,
        [AREAS.AKADOMARI_AREA]: true,
        [AREAS.SNACK]: true,
        [AREAS.PUBLIC_TOILET]: true,
        [AREAS.PARKING]: true,
    });

    const filteredPois = useMemo(() => { // useMemoを使ってフィルタリング
        return pois.filter(poi => areaVisibility[poi.area as AreaType]);
    }, [pois, areaVisibility]); // areaVisibility を依存配列に追加



    const areas = useMemo(() => Object.values(AREAS), []);
    const { pois, isLoading, error } = useSheetData(areas);

    const [mapInitialized, setMapInitialized] = useState(false);

    if (!isLoaded) return <div>Loading...</div>; // マップロード中はローディングメッセージ

    if (loadError || error) {
        return <div>エラー: {loadError?.message || error}</div>; // エラーメッセージ
    }

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
            {/* チェックボックス */}
            <div style={{ position: "absolute", top: 100, left: 10, zIndex: 1, backgroundColor: "white", padding: 10 }}> {/* チェックリストのスタイル */}
            {Object.entries(AREAS).map(([key, areaName]) => (
                <div key={key}>
                  <input
                    type="checkbox"
                    checked={areaVisibility[key as AreaType]}
                    onChange={(e) => {
                      const { checked } = e.target;
                      setAreaVisibility(prev => ({ ...prev, [key as AreaType]: checked })); // 型アサーションを追加
                    }}
                  />
                  <label>{areaName}</label>
                </div>
              ))}
            </div>

            <Map pois={filteredPois} mapInitialized={mapInitialized} setMapInitialized={setMapInitialized} />
            </div>
    );
};

const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
