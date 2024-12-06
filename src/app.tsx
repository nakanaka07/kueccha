import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";
import loadingImage from "./row1.png";

const App: React.FC = () => {
    // エリアの初期表示状態。全エリアを表示
    const initialAreaVisibility = useMemo(() => {
        return Object.values(AREAS).reduce((acc, areaName) => {
            acc[areaName] = true;
            return acc;
        }, {} as Record<AreaName, boolean>);
        // 依存配列は空なので、初回レンダリング時に一度だけ実行される
    }, []);

    // エリアの表示状態を管理するstate
    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);

    // スプレッドシートデータを取得
    const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

    // 表示するPOIをフィルタリング。poisとareaVisibilityが変更された場合のみ再計算
    const filteredPois = useMemo(() => {
        return pois.filter((poi) => areaVisibility[AREAS[poi.area]]);
    }, [pois, areaVisibility]);

    // チェックボックス変更ハンドラ。依存配列は空なので、初回レンダリング時に一度だけ作成される
    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
        setAreaVisibility((prev) => ({ ...prev, [areaName]: e.target.checked }));
    }, []);

    // ローディング状態を管理。true: ローディング中、false: ロード完了
    const [showLoader, setShowLoader] = useState(true);

    // チェックボックスエリアの表示状態を管理するstate (true: 表示, false: 非表示)
    const [isCheckboxVisible, setIsCheckboxVisible] = useState(true);

    // チェックボックスエリアのスタイルをuseMemoでキャッシュ
    const checkboxAreaStyle = useMemo(() => ({
        opacity: isCheckboxVisible ? 1 : 0, // isCheckboxVisibleに基づいてopacityを設定
        transition: "opacity 0.3s ease-in-out",
        position: "absolute" as const,
        top: "120px",
        left: "10px",
        zIndex: 1,
        backgroundColor: "white",
        padding: "10px",
    }), [isCheckboxVisible]); // isCheckboxVisible を依存配列に追加


    // setTimeoutのタイマーIDを格納
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // マップコンテナのref
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    // isLoading, showLoader, mapContainerRef.currentが変更されたら実行
    useEffect(() => {
        // データロード完了 & ローダー表示中 & マップコンテナがレンダリング済みならタイマー開始
        if (!isLoading && showLoader && mapContainerRef.current) {
            timerRef.current = setTimeout(() => setShowLoader(false), 500); // 0.5秒後にローダー非表示
        }

        // コンポーネントアンマウント時にタイマーをクリア
        return () => clearTimeout(timerRef.current as ReturnType<typeof setTimeout>);
        // 依存配列: isLoading, showLoader, mapContainerRef.current のいずれかが変更されたら再実行
    }, [isLoading, showLoader, mapContainerRef.current]);


    if (error) return <div>エラー: {error}</div>; // エラーがあればエラーメッセージを表示

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            {/* showLoaderがtrueの間ローディング画像を表示 */}
            {showLoader && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "white",
                        opacity: showLoader ? 1 : 0, // showLoaderに基づいてopacityを設定。フェードアウトアニメーション
                        transition: "opacity 4s ease-in-out",
                        zIndex: 2,
                    }}
                >
                    <img src={loadingImage} alt="Loading..." />
                </div>
            )}

            <div
                ref={mapContainerRef}
                style={{
                    opacity: showLoader ? 0 : 1,
                    transition: "opacity 4s ease-in-out",
                    width: "100%",
                    height: "100%",
                    position: "relative", // relativeを追加
                }}
                        >
                {/* スライダーをボタンに変更 */}
                <button
                    onClick={() => setIsCheckboxVisible(!isCheckboxVisible)} // クリックでisCheckboxVisibleを反転
                    style={{
                        position: "absolute", // 絶対配置を追加
                        top: "90px",       // 上からの位置を200pxに設定
                        left: "10px",         // 左からの位置を設定 (必要に応じて調整)
                        zIndex: 2,           // マップ要素より上に表示するためにzIndexを設定
                        /* 他のスタイル */
                    }}
                                >
                    {isCheckboxVisible ? "チェックボックスを隠す" : "チェックボックスを表示"}
                </button>

                {/* エリア選択チェックボックス */}
                <div style={checkboxAreaStyle}>
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

                <Map key={filteredPois.length} pois={filteredPois} />
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
