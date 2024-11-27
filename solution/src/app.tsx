// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api";
import { useSheetData } from "./useSheetData";
import Map from "./Map";
import { AREAS } from "./appConstants";
import type { AreaType } from "./appConstants";

const App = () => {
	const { isLoaded, loadError } = useLoadScript({
		googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
		mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
	});

	const [areaVisibility, setAreaVisibility] = useState<
		Record<AreaType, boolean>
	>(
		Object.fromEntries(
			(Object.keys(AREAS) as AreaType[]).map((area) => [area, true])
		) as Record<AreaType, boolean>
	);
	const areas = useMemo<AreaType[]>(() => Object.keys(AREAS) as AreaType[], []);
	const { pois, isLoading, error } = useSheetData(areas);

	const filteredPois = useMemo(
		() => pois.filter((poi) => areaVisibility[poi.area as AreaType]),
		[pois, areaVisibility]
	);

	const [mapInitialized, setMapInitialized] = useState(false);

	if (!isLoaded) return <div>Loading...</div>;

	if (loadError || error)
		return <div>エラー: {loadError?.message || error}</div>;

	return (
		<div style={{ width: "100%", height: "100vh", position: "relative" }}>
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
							checked={areaVisibility[areaKey as AreaType]}
							onChange={(e) => {
								setAreaVisibility((prev) => ({
									...prev,
									[areaKey]: e.target.checked,
								}));
							}}
						/>
						<label htmlFor={areaKey}>{areaName}</label>
					</div>
				))}
			</div>

			<Map
				pois={filteredPois}
				mapInitialized={mapInitialized}
				setMapInitialized={setMapInitialized}
			/>
		</div>
	);
};

const container = document.getElementById("app");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}

export default App;
