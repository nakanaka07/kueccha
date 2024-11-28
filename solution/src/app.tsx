// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS, AreaType, AreaName } from "./appConstants";
import type { Poi } from "./types.d.ts";

const App: React.FC = () => {
	const { isLoaded, loadError } = useLoadScript({
		googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
		mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
	});

	const initialAreaVisibility = useMemo<Record<AreaName, boolean>>(() => {
		const initialVisibility: Record<AreaName, boolean> = {} as Record<AreaName, boolean>;
		for (const areaName in AREAS) {
			initialVisibility[AREAS[areaName as AreaType]] = true;
		}
		return initialVisibility;
	}, []);

	const [areaVisibility, setAreaVisibility] = useState<Record<AreaName, boolean>>(initialAreaVisibility);

	const { pois, isLoading, error } = useSheetData(Object.keys(AREAS) as AreaType[]);

	const filteredPois: Poi[] = useMemo(() => {
		const filtered = pois.filter((poi) => areaVisibility[AREAS[poi.area]]);
		return filtered.length > 0 ? filtered : [];
	}, [pois, areaVisibility]);

	const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, areaName: AreaName) => {
		setAreaVisibility((prev) => ({ ...prev, [areaName]: e.target.checked }));
	}, []);

	if (!isLoaded) return <div>Loading...</div>;

	if (loadError || error) return <div>エラー: {loadError?.message || error}</div>;

	if (isLoading) return <div>Loading...</div>;

	return (
		<div style={{ width: "100%", height: "100vh", position: "relative" }}>
			<div style={{ position: "absolute", top: 100, left: 10, zIndex: 1, backgroundColor: "white", padding: 10 }}>
				{Object.entries(AREAS).map(([areaKey, areaName]) => (
					<div key={areaKey}>
						<input type="checkbox" checked={areaVisibility[areaName]} onChange={(e) => handleCheckboxChange(e, areaName)} />
						<label htmlFor={areaKey}>{areaName}</label>
					</div>
				))}
			</div>
			<Map pois={filteredPois} />
		</div>
	);
};

const container = document.getElementById("app");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}

export default App;
