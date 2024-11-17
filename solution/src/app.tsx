/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import { nanoid } from "nanoid";
import { Poi } from "./types.js"; // 型定義をインポート
import { usePoiData } from "./usePoiData.js"; // カスタムフックをインポート


// Helper function to validate URLs
function isValidHttpUrl(string: string) {
	let url;

	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}

	return url.protocol === "http:" || url.protocol === "https:";
}

// メインアプリケーションコンポーネント
const App = () => {
	const { pois: poisRyotsuAikawa, loading: loading1, error: error1 } = usePoiData("両津・相川地区");
	const { pois: poisKanaiSawata, loading: loading2, error: error2 } = usePoiData("金井・佐和田・新穂・畑野・真野地区");
	const { pois: poisAkadomariHamochi, loading: loading3, error: error3 } = usePoiData("赤泊・羽茂・小木地区");
	const { pois: poisSnack, loading: loading4, error: error4 } = usePoiData("スナック");
	const { pois: poisRestroom, loading: loading5, error: error5 } = usePoiData("公共トイレ");
	const { pois: poisParking, loading: loading6, error: error6 } = usePoiData("駐車場");

  const loading = loading1 || loading2 || loading3 || loading4 || loading5 || loading6;
	const error = error1 || error2 || error3 || error4 || error5 || error6;


	if (loading) {
		return <div>Loading...</div>; // ローディング表示
	}

	if (error) {
		return <div>Error: {error}</div>; // エラー表示
	}

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



// AdvancedMarkerElementをラップするクラス
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

const PoiMarkers = React.memo((props: { pois: Poi[]; pinColor: string }) => { // React.memoを追加
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
	}, [map, handleMapClick]); // handleMapClick を依存配列に追加

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

// アプリケーションのエントリーポイント
export default App;

// DOMにレンダリング
const root = createRoot(document.getElementById("app")!);
root.render(<App />);
