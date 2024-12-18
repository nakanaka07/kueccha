// src/app.tsx
import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import loadingImage from "./row1.png";
import { LoadScript } from "@react-google-maps/api"; // Google Maps API を読み込むためのコンポーネント

// 必要なGoogle Maps APIのライブラリを指定
const libraries = ["marker"];

const App: React.FC = () => {
    // スプレッドシートデータを読み込むカスタムフック
    const { pois, isLoading, error, retry } = useSheetData();

    // 各エリアの初期表示状態を決定（すべてtrue = 表示）
    // useMemoでメモ化することで、AREASが変わらない限り再計算されない
    const initialAreaVisibility = useMemo<Record<AreaType, boolean>>(() => {
        return Object.keys(AREAS).reduce((acc, area) => {
            acc[area as AreaType] = true;
            return acc;
        }, {} as Record<AreaType, boolean>);
    }, []);

    // 各エリアの表示状態を管理するstate
    const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(initialAreaVisibility);

    // 表示するPOIを絞り込む
    // useMemoでメモ化することで、poisまたはareaVisibilityが変更された場合のみ再計算される
    const filteredPois = useMemo(() => pois.filter(poi => areaVisibility[poi.area]), [pois, areaVisibility]);

    // チェックボックス変更時のコールバック関数
    // useCallbackでメモ化することで、パフォーマンスを向上させる
    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaType: AreaType) => {
        // チェックボックスの状態を更新 (関数型アップデート)
        setAreaVisibility(prev => ({ ...prev, [areaType]: e.target.checked }));
    }, []);

    // マーカークリック時のコールバック関数
    // useCallbackでメモ化することで、パフォーマンスを向上させる
    const handleMarkerClick = useCallback((areaType: AreaType) => {
        // マーカーに対応するエリアの表示状態を切り替える (関数型アップデート)
        setAreaVisibility(prev => ({ ...prev, [areaType]: !prev[areaType] }));
    }, []);

    // チェックボックスエリアの表示状態を管理するstate
    const [isCheckboxVisible, setIsCheckboxVisible] = useState(true);

    // チェックボックスエリアのクラス名を動的に決定
    const checkboxAreaClassName = isCheckboxVisible ? "checkbox-area visible" : "checkbox-area hidden";

    // エラー発生時の表示
    if (error) {
        return (
            <div>
                <p>エラーが発生しました：{error.message}</p>
                <button onClick={retry}>再試行</button>
            </div>
        );
    }

    // ローディング中の表示
    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <img src={loadingImage} alt="Loading..." style={{ width: "20%", minWidth: "200px", maxWidth: "80vw" }} />
            </div>
        );
    }

    return (
        <LoadScript // Google Maps APIを読み込み
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            id="google-map-script"
            mapIds={[import.meta.env.VITE_GOOGLE_MAPS_MAP_ID]}
            version="weekly"
            language="ja"
        >
            <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", position: "relative" }}>
                    <Map pois={filteredPois} />  {/* 地図コンポーネントに絞り込まれたPOIデータを渡す */}

                    {/* チェックボックス表示切り替えボタン */}
                    <button
                        onClick={() => setIsCheckboxVisible(!isCheckboxVisible)} // ボタンクリックで表示状態をトグル
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
