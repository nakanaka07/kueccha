import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";
import loadingImage from "./row1.png";

const App: React.FC = () => {
    // エリアの初期表示状態を管理するstate。全てのエリアを初期状態で表示
    const initialAreaVisibility = useMemo(() => {
        return Object.values(AREAS).reduce((acc, areaName) => {
            acc[areaName] = true;
            return acc;
        }, {} as Record<AreaName, boolean>);
    }, []);

    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);

    // スプレッドシートデータの取得
    const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

    // 表示するPOIをareaVisibilityに基づいてフィルタリング
    const filteredPois = useMemo(() => {
        return pois.filter(poi => areaVisibility[AREAS[poi.area]]);
    }, [pois, areaVisibility]);

    // チェックボックスの変更ハンドラ
    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
        setAreaVisibility(prev => ({ ...prev, [areaName]: e.target.checked }));
    }, []);

    // ローディング状態を管理するstate. 初期値はtrue(ローディング中)
    const [showLoader, setShowLoader] = useState(true);
    // setTimeoutのタイマーIDを格納するref
    const timerRef = useRef<NodeJS.Timeout | null>(null);


    // isLoadingが変化した時に実行されるuseEffect
    useEffect(() => {
        // isLoadingがfalse(データ取得完了)になったら、1秒後にローダーを非表示にするタイマーを設定
        if (!isLoading && showLoader) {
            timerRef.current = setTimeout(() => {
                setShowLoader(false);
            }, 500);
        }

        // クリーンアップ関数: コンポーネントがアンマウントされる前にタイマーをクリアする
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isLoading, showLoader]); // isLoadingまたはshowLoaderが変更された時にuseEffectが再実行される


    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            {/* ローディング画像. showLoaderがtrue(ローディング中)の間表示される */}
            {showLoader && (
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
                    opacity: showLoader ? 1 : 0, // showLoaderに応じてopacityを変化させる
                    transition: "opacity 1s ease-in-out", // 1秒かけてフェードアウト
                    zIndex: 2,
                }}>
                    <img src={loadingImage} alt="Loading..." />
                </div>
            )}

            {/* マップとチェックボックスのコンテナ. showLoaderがfalse(ローディング完了)になると表示される */}
            <div style={{
                opacity: showLoader ? 0 : 1,  // showLoaderに応じてopacityを変化させる
                transition: "opacity 1s ease-in-out", // 1秒かけてフェードイン
                width: "100%",
                height: "100%",
            }}>
                {/* エリア選択チェックボックス */}
                <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1, backgroundColor: "white", padding: 10 }}>
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

                <Map pois={filteredPois} /> {/* マップコンポーネント */}
            </div>
        </div>
    );
};


// アプリケーションのエントリポイント
const container = document.getElementById("app");
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

export default App;
