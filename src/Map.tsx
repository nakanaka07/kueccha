// src/Map.tsx

import React, { useState, useCallback, useMemo, memo } from "react";
import {
	GoogleMap,
	InfoWindow,
	useJsApiLoader,
	Libraries,
} from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Poi } from "./types";
import { MAP_CONFIG, AREA_COLORS, AREAS } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

// MapコンポーネントのProps型
interface MapProps {
	pois: Poi[];
}

const defaultMarkerColor = "#000000"; // デフォルトのマーカーの色
const libraries: Libraries = ["marker"]; // 使用するライブラリ

const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => {
	// Google Maps APIの読み込み状態
	const { isLoaded } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
		libraries,
		mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID],
		version: "weekly",
		language: "ja", // 日本語設定
	});

	// アクティブなマーカーの状態
	const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
	// マーカークラスタラーの状態
	const [markerClusterer, setMarkerClusterer] =
		useState<MarkerClusterer | null>(null);

	// マーカークリック時のコールバック関数
	const handleMarkerClick = useCallback((poi: Poi) => {
		setActiveMarker(poi);
	}, []);

	// マップクリック時のコールバック関数
	const handleMapClick = useCallback(() => {
		setActiveMarker(null);
	}, []);

	// マーカーコンテンツ生成関数
	const createMarkerContent = useCallback((color: string) => {
		const div = document.createElement("div");
		div.style.width = "24px";
		div.style.height = "24px";
		div.style.borderRadius = "50%";
		div.style.backgroundColor = color;
		div.style.border = "2px solid white";
		div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
		return div;
	}, []);

	// マップのメモ化
	const map = useMemo(() => {
		if (!isLoaded) return <div>Loading...</div>;

		console.log("Google Maps API loaded.", { poiCount: pois.length }); // POIの件数のみを出力
		console.debug("AREA_COLORS:", AREA_COLORS); // デバッグレベルで出力
		console.debug("AREAS:", AREAS); // デバッグレベルで出力

		return (
			<GoogleMap
				mapContainerStyle={MAP_CONFIG.mapContainerStyle}
				center={MAP_CONFIG.defaultCenter}
				zoom={MAP_CONFIG.defaultZoom}
				options={{
					mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
					disableDefaultUI: false,
					clickableIcons: false,
				}}
				// マップ読み込み時の処理
				onLoad={(map) => {
					console.log("Google Maps API loaded.", { poiCount: pois.length });
					console.debug("AREA_COLORS:", AREA_COLORS);
					console.debug("AREAS:", AREAS);
					console.log("Map onLoad called.");

					const markers = pois
						.map((poi, index) => {
							try {
								const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;
								const markerElement =
									new google.maps.marker.AdvancedMarkerElement({
										map,
										position: poi.location,
										title: poi.name,
										content: createMarkerContent(markerColor),
									});

								markerElement.addListener("click", () =>
									handleMarkerClick(poi)
								);

								return markerElement;
							} catch (error) {
								console.error(
									"Error creating marker for POI at index",
									index,
									":",
									error,
									poi
								);
								return null;
							}
						})
						.filter((marker) => marker !== null);

					if (markerClusterer) {
						markerClusterer.clearMarkers();
					}

					try {
						const newMarkerClusterer = new MarkerClusterer({ map, markers });
						setMarkerClusterer(newMarkerClusterer);
						console.log(
							"MarkerClusterer created with",
							markers.length,
							"markers."
						);
					} catch (clustererError) {
						console.error("Error creating MarkerClusterer:", clustererError);
					}
				}}
				onClick={handleMapClick}
			>
				{/* アクティブなマーカーがあればInfoWindowを表示 */}
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
		// 依存配列
	}, [
		pois,
		handleMapClick,
		createMarkerContent,
		activeMarker,
		markerClusterer,
	]);

	return map;
});

export default Map;
