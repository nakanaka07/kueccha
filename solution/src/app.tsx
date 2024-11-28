// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";
import type { Poi } from "./types.d.ts"; // Poi型をインポート

// アプリケーションのルートコンポーネント
const App: React.FC = () => {
	// Google Maps APIの読み込み状態を確認
	const { isLoaded, loadError } = useLoadScript({
		googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
		mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
	});

	// エリアの表示/非表示状態の初期値 (useMemoでメモ化) - 修正
	const initialAreaVisibility = useMemo<Record<AreaName, boolean>>(() => {
		// Record<AreaName, boolean>型で初期化
		const initialVisibility: Record<AreaName, boolean> = {} as Record<
			AreaName,
			boolean
		>;
		for (const areaName in AREAS) {
			// for...inループでAREASのキーをイテレート
			initialVisibility[AREAS[areaName as AreaType]] = true; // 正しいキーを使って値を設定
		}
		return initialVisibility;
	}, []);

	// エリアの表示/非表示状態を管理するstate
	const [areaVisibility, setAreaVisibility] = useState<
		Record<AreaName, boolean>
	>(initialAreaVisibility);

	// スプレッドシートデータを取得
	const { pois, isLoading, error } = useSheetData(
		Object.keys(AREAS) as AreaType[]
	);

	// 表示するPOIを絞り込む (useMemoでメモ化) - 型ガードを追加
	const filteredPois: Poi[] = useMemo(() => {
		const filtered = pois.filter((poi) => areaVisibility[AREAS[poi.area]]);
		return filtered.length > 0 ? filtered : []; // filteredが空の場合は空配列を返す
	}, [pois, areaVisibility]);

	// チェックボックスの変更ハンドラ (メモ化)
	const handleCheckboxChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
			setAreaVisibility((prev) => ({ ...prev, [areaName]: e.target.checked }));
		},
		[]
	);

	// Google Maps APIが読み込み中の場合
	if (!isLoaded) return <div>Loading...</div>;

	// APIの読み込みエラーまたはデータ取得エラーが発生した場合
	if (loadError || error)
		return <div>エラー: {loadError?.message || error}</div>;

	// スプレッドシートデータが読み込み中の場合
	if (isLoading) return <div>Loading...</div>;

	return (
		<div style={{ width: "100%", height: "100vh", position: "relative" }}>
			{/* チェックボックスエリア */}
			<div
				style={{
					position: "absolute",
					top: 100,
					left: 10,
					zIndex: 1,
					backgroundColor: "white",
					padding: 10,
				}}
			>
				{Object.entries(AREAS).map(([areaKey, areaName]) => (
					<div key={areaKey}>
						<input
							type="checkbox"
							checked={areaVisibility[areaName]}
							onChange={(e) => handleCheckboxChange(e, areaName)}
						/>
						<label htmlFor={areaKey}>{areaName}</label>
					</div>
				))}
			</div>

			{/* マップ */}
            <Map pois={filteredPois} />  {/* Mapコンポーネントにpoisプロパティのみを渡す */}
		</div>
	);
};

// アプリケーションをDOMにレンダリング
const container = document.getElementById("app");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}

export default App;
