import React, { useEffect, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import {
	MarkerClusterer,
	SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import type { Poi } from "./types.js";
import { useSheetData } from "./useSheetData.js";
import { InfoWindow } from "@react-google-maps/api";

const isValidHttpUrl = (string: string): boolean => {
	try {
		return Boolean(new URL(string));
	} catch {
		return false;
	}
};

const AREAS = {
	RYOTSU_AIKAWA: "両津・相川地区",
	KANAI_AREA: "金井・佐和田・新穂・畑野・真野地区",
	AKADOMARI_AREA: "赤泊・羽茂・小木地区",
	SNACK: "スナック",
	PUBLIC_TOILET: "公共トイレ",
	PARKING: "駐車場",
} as const;

type AreaType = (typeof AREAS)[keyof typeof AREAS];

const AREA_COLORS: Record<AreaType, string> = {
	[AREAS.RYOTSU_AIKAWA]: "#FBBC04",
	[AREAS.KANAI_AREA]: "#00ff40",
	[AREAS.AKADOMARI_AREA]: "#FFFFFF",
	[AREAS.SNACK]: "#ff0080",
	[AREAS.PUBLIC_TOILET]: "#00ffff",
	[AREAS.PARKING]: "#c0c0c0",
} as const;

const MAP_CONFIG = {
	mapContainerStyle: { width: "100%", height: "100vh" },
	defaultCenter: { lat: 38, lng: 138.5 },
	defaultZoom: 10,
} as const;

const App: React.FC = () => {
	const { pois: allPois, loading, error } = useSheetData(Object.values(AREAS));

	const { isLoaded } = useLoadScript({
		id: "google-map-script",
		googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY,
		libraries: ["marker"],
	});

	if (loading || !isLoaded) {
		return <div className="loading">Loading...</div>;
	}

	if (error) {
		return <div className="error">Error: {error}</div>;
	}

	const categorizedPois = Object.values(AREAS).reduce<Record<AreaType, Poi[]>>(
		(acc, area) => {
			acc[area as AreaType] = allPois.filter((poi) => poi.area === area);
			return acc;
		},
		{} as Record<AreaType, Poi[]>
	);

	return (
		<div className="map-container">
			<GoogleMap
				mapContainerStyle={MAP_CONFIG.mapContainerStyle}
				center={MAP_CONFIG.defaultCenter}
				zoom={MAP_CONFIG.defaultZoom}
				options={{
					mapId: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID,
					disableDefaultUI: true,
					zoomControl: true,
				}}
			>
				{Object.entries(categorizedPois).map(([area, pois]) => (
					<PoiMarkers
						key={area}
						pois={pois}
						pinColor={AREA_COLORS[area as AreaType]}
					/>
				))}
			</GoogleMap>
		</div>
	);
};

interface PoiMarkersProps {
	pois: Poi[];
	pinColor: string;
}

const PoiMarkers: React.FC<PoiMarkersProps> = React.memo(
	({ pois, pinColor }) => {
		const [map, setMap] = useState<google.maps.Map | null>(null);
		const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
		const clustererRef = useRef<MarkerClusterer | null>(null);
		const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

		const onMapLoad = useCallback((map: google.maps.Map) => {
			setMap(map);
		}, []);

		const handleMarkerClick = useCallback((poi: Poi) => {
			setActiveMarker(poi);
		}, []);

		useEffect(() => {
			if (!map || !google.maps?.marker?.AdvancedMarkerElement) return;

			markersRef.current.forEach((marker) => {
				marker.map = null;
			});

			if (clustererRef.current) {
				clustererRef.current.clearMarkers();
			}

			const newMarkers = pois.map((poi) => {
				const marker = new google.maps.marker.AdvancedMarkerElement({
					position: poi.location,
					map,
					title: poi.name,
				});

				marker.addListener("click", () => handleMarkerClick(poi));
				return marker;
			});

			if (!clustererRef.current) {
				const algorithm = new SuperClusterAlgorithm({
					radius: 60, // クラスターの半径
					maxZoom: 15, // 最大ズームレベル
					minPoints: 2, // クラスター形成に必要な最小ポイント数
				});

				clustererRef.current = new MarkerClusterer({
					map,
					markers: newMarkers,
					algorithm,
					renderer: {
						render: ({ count, position }) => {
							const marker = new google.maps.marker.AdvancedMarkerElement({
								position,
								map,
								content: document.createElement("div"),
							});

							if (marker.content instanceof HTMLElement) {
								marker.content.className = "cluster-marker";
								marker.content.textContent = String(count);
								marker.content.style.background = pinColor;
								marker.content.style.width = "30px";
								marker.content.style.height = "30px";
								marker.content.style.borderRadius = "50%";
								marker.content.style.display = "flex";
								marker.content.style.justifyContent = "center";
								marker.content.style.alignItems = "center";
								marker.content.style.color = "#fff";
								marker.content.style.fontSize = "14px";
								marker.content.style.fontWeight = "bold";
							}

							return marker;
						},
					},
				});
			} else {
				clustererRef.current.addMarkers(newMarkers);
			}

			markersRef.current = newMarkers;

			return () => {
				markersRef.current.forEach((marker) => {
					marker.map = null;
				});

				if (clustererRef.current) {
					clustererRef.current.clearMarkers();
					clustererRef.current = null;
				}
			};
		}, [map, pois, handleMarkerClick, pinColor]);

		const InfoWindowContent: React.FC<{ poi: Poi }> = React.memo(({ poi }) => (
			<div className="info-window">
				<h2>{poi.name}</h2>
				<div className="info-grid">
					<div className="info-row">
						<span>カテゴリ:</span>
						<span>{poi.category}</span>
					</div>
					<div className="info-row">
						<span>ジャンル:</span>
						<span>{poi.genre}</span>
					</div>
					{poi.information && (
						<div className="info-row">
							<span>情報:</span>
							<span>
								{isValidHttpUrl(poi.information) ? (
									<a
										href={poi.information}
										target="_blank"
										rel="noopener noreferrer"
									>
										詳細を見る
									</a>
								) : (
									poi.information
								)}
							</span>
						</div>
					)}
					<div className="business-hours">
						<h3>営業時間</h3>
						{[
							{ day: "月", hours: poi.monday },
							{ day: "火", hours: poi.tuesday },
							{ day: "水", hours: poi.wednesday },
							{ day: "木", hours: poi.thursday },
							{ day: "金", hours: poi.friday },
							{ day: "土", hours: poi.saturday },
							{ day: "日", hours: poi.sunday },
							{ day: "祝", hours: poi.holiday },
						].map(({ day, hours }) => (
							<div key={day} className="hours-row">
								<span>{day}:</span>
								<span>{hours || "定休日"}</span>
							</div>
						))}
					</div>
					{[
						{ label: "補足", value: poi.description },
						{ label: "予約", value: poi.reservation },
						{ label: "支払い", value: poi.payment },
						{ label: "電話番号", value: poi.phone },
						{ label: "住所", value: poi.address },
					].map(
						({ label, value }) =>
							value && (
								<div key={label} className="info-row">
									<span>{label}:</span>
									<span>{value}</span>
								</div>
							)
					)}
					{poi.view && (
						<div className="info-row">
							<span>Google マップで見る:</span>
							<a href={poi.view} target="_blank" rel="noopener noreferrer">
								地図を開く
							</a>
						</div>
					)}
				</div>
			</div>
		));

		return (
			<>
				{activeMarker && (
					<InfoWindow
						position={activeMarker.location}
						onCloseClick={() => setActiveMarker(null)}
					>
						<InfoWindowContent poi={activeMarker} />
					</InfoWindow>
				)}
			</>
		);
	}
);

PoiMarkers.displayName = "PoiMarkers";

export default App;

const container = document.getElementById("app");
if (container) {
	const root = createRoot(container);
	root.render(<App />);
}
