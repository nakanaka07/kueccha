import React, { useEffect, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
	APIProvider,
	Map,
	useMap,
	AdvancedMarker,
	Pin,
	InfoWindow,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Circle } from "./components/circle.js";
import { Poi } from "./types.js";
import { usePoiData } from "./usePoiData.js";

function isValidHttpUrl(string: string) {
	let url;

	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}

	return url.protocol === "http:" || url.protocol === "https:";
}

const App = () => {
	const areas = [
		"両津・相川地区",
		"金井・佐和田・新穂・畑野・真野地区",
		"赤泊・羽茂・小木地区",
		"スナック",
		"公共トイレ",
		"駐車場",
	];

	const { pois: allPois, loading, error } = usePoiData(areas);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	const poisRyotsuAikawa = allPois.filter(
		(poi) => poi.area === "両津・相川地区"
	);
	const poisKanaiSawata = allPois.filter(
		(poi) => poi.area === "金井・佐和田・新穂・畑野・真野地区"
	);
	const poisAkadomariHamochi = allPois.filter(
		(poi) => poi.area === "赤泊・羽茂・小木地区"
	);
	const poisSnack = allPois.filter((poi) => poi.area === "スナック");
	const poisRestroom = allPois.filter((poi) => poi.area === "公共トイレ");
	const poisParking = allPois.filter((poi) => poi.area === "駐車場");

	return (
		<APIProvider apiKey={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY}>
			<Map
				defaultZoom={10}
				defaultCenter={{ lat: 38, lng: 138.5 }}
				mapId={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID}
			>
				<PoiMarkers pois={poisRyotsuAikawa} pinColor="#FBBC04" />
				<PoiMarkers pois={poisKanaiSawata} pinColor="#00ff40" />
				<PoiMarkers pois={poisAkadomariHamochi} pinColor="#FFFFFF" />
				<PoiMarkers pois={poisSnack} pinColor="#ff0080" />
				<PoiMarkers pois={poisRestroom} pinColor="#00ffff" />
				<PoiMarkers pois={poisParking} pinColor="#c0c0c0" />
			</Map>
		</APIProvider>
	);
};

class AdvancedMarkerWrapper {
	private advancedMarker: google.maps.marker.AdvancedMarkerElement;

	constructor(options: google.maps.marker.AdvancedMarkerElementOptions) {
		this.advancedMarker = new google.maps.marker.AdvancedMarkerElement(options);
	}

	getPosition() {
		return this.advancedMarker.position;
	}

	setMap(map: google.maps.Map | null) {
		this.advancedMarker.map = map;
	}

	getAdvancedMarker() {
		return this.advancedMarker;
	}
}

const PoiMarkers = React.memo((props: { pois: Poi[]; pinColor: string }) => {
	const map = useMap();
	const [markers, setMarkers] = useState<{
		[key: string]: AdvancedMarkerWrapper;
	}>({});
	const clusterer = useRef<MarkerClusterer | null>(null);
	const [circleCenter, setCircleCenter] =
		useState<google.maps.LatLngLiteral | null>(null);
	const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
	const [showCircle, setShowCircle] = useState(false);

	const handleClick = useCallback((poi: Poi) => {
		setActiveMarker(poi);
		setCircleCenter(poi.location);
		setShowCircle(true);
	}, []);

	const handleMapClick = useCallback(() => {
		setActiveMarker(null);
		setShowCircle(false);
	}, []);

	useEffect(() => {
		if (!map) return;

		if (!clusterer.current) {
			clusterer.current = new MarkerClusterer({ map });
		}

		const listener = map.addListener("click", handleMapClick);

		return () => {
			google.maps.event.removeListener(listener);
		};
	}, [map, handleMapClick]);

	useEffect(() => {
		if (!clusterer.current) return;

		clusterer.current.clearMarkers();

		const advancedMarkers = Object.values(markers).map((wrapper) =>
			wrapper.getAdvancedMarker()
		);
		clusterer.current.addMarkers(advancedMarkers);
	}, [markers]);

	const setMarkerRef = (
		marker: google.maps.marker.AdvancedMarkerElement | null,
		key: string
	) => {
		if (marker && markers[key]) return;
		if (!marker && !markers[key]) return;

		setMarkers((prev) => {
			if (marker) {
				const wrapper = new AdvancedMarkerWrapper({
					position: marker.position,
					map: map,
				});
				return { ...prev, [key]: wrapper };
			} else {
				const newMarkers = { ...prev };
				delete newMarkers[key];
				return newMarkers;
			}
		});
	};

	return (
		<>
			{/* サークルを表示 */}
			{showCircle && (
				<Circle
					radius={500}
					center={circleCenter}
					strokeColor={"#0c4cb3"}
					strokeOpacity={1}
					strokeWeight={3}
					fillColor={"#3b82f6"}
					fillOpacity={0.3}
					clickable={false}
				/>
			)}
			{/* POI の数だけマーカーを表示 */}
			{props.pois.map((poi: Poi) => (
				<AdvancedMarker
					key={poi.key}
					position={poi.location}
					zIndex={100}
					ref={(marker) => setMarkerRef(marker, poi.key)}
					onClick={() => handleClick(poi)}
					aria-label={`Marker for ${poi.name}`} // アクセシビリティ向上
				>
					<Pin
						background={props.pinColor}
						glyphColor={"#000"}
						borderColor={"#000"}
					/>
					{activeMarker === poi && (
						<InfoWindow
							position={poi.location}
							pixelOffset={new google.maps.Size(0, -50)}
							onCloseClick={() => {
								setActiveMarker(null);
								setShowCircle(false);
							}}
						>
							<div>
								<h2>{poi.name}</h2>
								<p>カテゴリ: {poi.category}</p>
								<p>ジャンル: {poi.genre}</p>
								{poi.information && (
									<p>
										情報:{" "}
										{isValidHttpUrl(poi.information) ? (
											<a
												href={poi.information}
												target="_blank"
												rel="noopener noreferrer"
											>
												{poi.information}
											</a>
										) : (
											poi.information
										)}
									</p>
								)}
								<p>営業時間:</p>
								<ul>
									<li>月: {poi.monday}</li>
									<li>火: {poi.tuesday}</li>
									<li>水: {poi.wednesday}</li>
									<li>木: {poi.thursday}</li>
									<li>金: {poi.friday}</li>
									<li>土: {poi.saturday}</li>
									<li>日: {poi.sunday}</li>
									<li>祝: {poi.holiday}</li>
								</ul>
								<p>補足:{poi.description}</p>
								<p>予約: {poi.reservation}</p>
								<p>支払い: {poi.payment}</p>
								<p>電話番号: {poi.phone}</p>
								<p>住所: {poi.address}</p>
								{poi.view && (
									<p>
										Google マップで見る:{" "}
										{isValidHttpUrl(poi.view) ? (
											<a
												href={poi.view}
												target="_blank"
												rel="noopener noreferrer"
											>
												{poi.view}
											</a>
										) : (
											poi.view
										)}
									</p>
								)}
							</div>
						</InfoWindow>
					)}
				</AdvancedMarker>
			))}
		</>
	);
});

export default App;

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
