import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";

const App: React.FC = () => {
    // 初期エリアの表示状態を定義
    const initialAreaVisibility = useMemo(() => {
        return Object.values(AREAS).reduce((acc, areaName) => {
            acc[areaName] = true;
            return acc;
        }, {} as Record<AreaName, boolean>);
    }, []);

    // エリアの表示状態を管理するstate
    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);

    // スプレッドシートのデータを取得
    const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

    // 表示するPOIをフィルタリング
    const filteredPois = useMemo(() => {
        return pois.filter(poi => areaVisibility[AREAS[poi.area]]);
    }, [pois, areaVisibility]);

    // チェックボックスの変更ハンドラ
    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
        setAreaVisibility(prev => ({ ...prev, [areaName]: e.target.checked }));
    }, []);

    // ローディング中またはエラー発生時の処理
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>エラー: {error}</div>;

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
            {/* エリア選択チェックボックス */}
            <div style={{ position: "absolute", top: 100, left: 10, zIndex: 1, backgroundColor: "white", padding: 10 }}>
                {Object.entries(AREAS).map(([areaKey, areaName]) => (
                    <div key={areaKey}>
                        <input
                            type="checkbox"
                            id={areaKey}
                            checked={areaVisibility[areaName]}
                            onChange={(e) => handleCheckboxChange(e, areaName)}
                        />
                        <label htmlFor={areaKey}>{areaName}</label>
                    </div>
                ))}
            </div>

            {/* マップ */}
            <Map key={filteredPois.length} pois={filteredPois} />
        </div>
    );
};


const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
