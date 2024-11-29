// Map.tsx: マップを表示するコンポーネント
import React, { useState, useCallback, useMemo, memo } from "react";
import {
	GoogleMap,
	InfoWindow,
	Marker,
	MarkerClusterer,
	useJsApiLoader,
} from "@react-google-maps/api";
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS, AREAS, AreaType } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

// MapコンポーネントのPropsの型定義
interface MapProps {
	pois: Poi[];
}

const defaultMarkerColor = "#000000"; // デフォルトのマーカーの色

// Mapコンポーネント (メモ化)
const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => {
	const { isLoaded } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
		libraries: ["marker"],
		mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID],
	});

	// クリックされたマーカーの情報を格納するstate
	const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

	// マーカークリック時のハンドラ (メモ化)
	const handleMarkerClick = useCallback((poi: Poi) => {
		setActiveMarker(poi);
	}, []);

	// マップクリック時のハンドラ (メモ化) 情報ウィンドウを閉じる
	const handleMapClick = useCallback(() => {
		setActiveMarker(null);
	}, []);

	// マーカーのアイコン設定 (共通化、依存配列を空に)
	const markerIcon = useCallback(
		(area: AreaType) => ({
			// area を引数として受け取る
			path: google.maps.SymbolPath.CIRCLE,
			fillColor: AREA_COLORS[AREAS[area]] || defaultMarkerColor, // フォールバックカラー
			fillOpacity: 1,
			strokeColor: AREA_COLORS[AREAS[area]] || defaultMarkerColor, // フォールバックカラー
			strokeWeight: 2,
			scale: 12,
		}),
		[]
	);

	const map = useMemo(() => {
		if (!isLoaded) return <div>Loading...</div>;

		return (
			<GoogleMap
				mapContainerStyle={MAP_CONFIG.mapContainerStyle}
				center={MAP_CONFIG.defaultCenter}
				zoom={MAP_CONFIG.defaultZoom}
				options={{
					mapId: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID,
					disableDefaultUI: false,
				}}
				onClick={handleMapClick}
			>
				<MarkerClusterer>
					{(clusterer) => (
						<>
							{pois.map((poi) => (
								<Marker
									key={poi.key}
									position={poi.location}
									title={poi.name}
									onClick={() => handleMarkerClick(poi)}
									icon={markerIcon(poi.area)}
								/>
							))}
						</>
					)}
				</MarkerClusterer>

				{/* 情報ウィンドウ */}
				{activeMarker && (
					<InfoWindow
						position={activeMarker.location}
						onCloseClick={() => setActiveMarker(null)}
					>
						<InfoWindowContent poi={activeMarker} />
					</InfoWindow>
				)}
			</GoogleMap>
		);
	}, [isLoaded, pois, markerIcon, handleMapClick]); // 依存配列を追加

	return map; // useMemo の結果を返す
});

export default Map;
