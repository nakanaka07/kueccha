import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useSheetData } from "./useSheetData"; // スプレッドシートデータ取得用のカスタムフック
import Map from "./Map"; // マップコンポーネント
import { AREAS, AreaType, AreaName } from "./appConstants"; // エリア定数

const App: React.FC = () => {
    // エリアの初期表示状態を定義。全てのエリアを初期状態で表示する
    const initialAreaVisibility = useMemo(() => {
        return Object.values(AREAS).reduce((acc, areaName) => {
            acc[areaName] = true; // 全てのエリアをtrue（表示）に設定
            return acc;
        }, {} as Record<AreaName, boolean>);
    }, []); // AREASが変更された場合のみ再計算

    // エリアの表示状態を管理するstate。初期値はinitialAreaVisibility
    const [areaVisibility, setAreaVisibility] = useState(initialAreaVisibility);

    // スプレッドシートデータを取得。useSheetDataカスタムフックを使用
    const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

    // 表示するPOIをareaVisibilityに基づいてフィルタリング
    const filteredPois = useMemo(() => {
        return pois.filter(poi => areaVisibility[AREAS[poi.area]]); // 表示設定がtrueのエリアのPOIのみを返す
    }, [pois, areaVisibility]); // poisまたはareaVisibilityが変更された場合のみ再計算

    // チェックボックスの変更ハンドラ
    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
        // チェックボックスの状態に応じてareaVisibilityを更新
        setAreaVisibility(prev => ({ ...prev, [areaName]: e.target.checked }));
    }, []); // 依存関係がないため、一度だけ作成される

    // ローディング中またはエラー発生時の処理
    if (isLoading) return <div>Loading...</div>; // データ読み込み中はローディングメッセージを表示
    if (error) return <div>エラー: {error}</div>;    // エラー発生時はエラーメッセージを表示

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative" }}>
            {/* エリア選択チェックボックス */}
            <div style={{ position: "absolute", top: 100, left: 10, zIndex: 1, backgroundColor: "white", padding: 10 }}>
                {/* AREASオブジェクトの各エントリに対してチェックボックスをレンダリング */}
                {Object.entries(AREAS).map(([areaKey, areaName]) => (
                    <div key={areaKey}>
                        <input
                            type="checkbox"
                            id={areaKey}
                            checked={areaVisibility[areaName]} // チェック状態をareaVisibilityに基づいて設定
                            onChange={(e) => handleCheckboxChange(e, areaName)} // 変更時にhandleCheckboxChangeを呼び出す
                        />
                        <label htmlFor={areaKey}>{areaName}</label> {/* エリア名を表示 */}
                    </div>
                ))}
            </div>

            {/* マップコンポーネント */}
            {/* filteredPoisのlengthをkeyに指定することで、POIの数が変更された時にマップが再レンダリングされる */}
            <Map key={filteredPois.length} pois={filteredPois} />
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
