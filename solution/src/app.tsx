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

interface Poi {
	key: string;
	location: google.maps.LatLngLiteral;
	name: string;
	category: string;
	genre: string;
	monday: string;
	tuesday: string;
	wednesday: string;
	thursday: string;
	friday: string;
	saturday: string;
	sunday: string;
	holiday: string;
	description: string;
	reservation: string;
	payment: string;
	phone: string;
	address: string;
	information: string;
	view: string;
}

const isValidHttpUrl = (string: string) => {
	try {
		const url = new URL(string);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
};

const App = () => {
	const [pois, setPois] = useState<Poi[][]>([[], [], [], [], [], []]); // 配列の配列でPOIデータを管理
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
		const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
		const sheetNames = [
			"両津・相川地区",
			"金井・佐和田・新穂・畑野・真野地区",
			"赤泊・羽茂・小木地区",
			"スナック",
			"公共トイレ",
			"駐車場",
		];

		if (!spreadsheetId || !apiKey) {
			setError("Spreadsheet ID or API Key is missing.");
			setLoading(false);
			return;
		}

		const loadData = async (sheetName: string, index: number) => {
			try {
				const response = await fetch(
					`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A:AY?key=${apiKey}`
				);
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						`HTTP error! status: ${response.status} ${errorData.error.message}`
					);
				}

				const data = await response.json();
				if (!data.values) {
					throw new Error("スプレッドシートのデータが取得できませんでした");
				}

				const poiData = data.values.slice(1).map((row: any[]) => ({
					key: nanoid(),
					location: {
						lat: parseFloat(row[47]) || 0, // || 0 でNaNを0に変換
						lng: parseFloat(row[46]) || 0,
					},
					name: row[43] ?? "",
					category: row[26] ?? "",
					genre: row[27] ?? "",
					monday: row[28] ?? "",
					tuesday: row[29] ?? "",
					wednesday: row[30] ?? "",
					thursday: row[31] ?? "",
					friday: row[32] ?? "",
					saturday: row[33] ?? "",
					sunday: row[34] ?? "",
					holiday: row[35] ?? "",
					description: row[36] ?? "",
					reservation: row[37] ?? "",
					payment: row[38] ?? "",
					phone: row[39] ?? "",
					address: row[40] ?? "",
					information: row[41] ?? "",
					view: row[42] ?? "",
				}));

				setPois((prev) => {
					const newPois = [...prev];
					newPois[index] = poiData;
					return newPois;
				});
			} catch (error: any) {
				setError(error.message);
				console.error("Error loading spreadsheet data:", error);
			}
		};

		const loadAllData = async () => {
			setLoading(true);
			try {
				await Promise.all(
					sheetNames.map((sheetName, index) => loadData(sheetName, index))
				);
			} finally {
				setLoading(false);
			}
		};

		loadAllData();
	}, []);

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
				<PoiMarkers pois={pois[0]} pinColor="#FBBC04" />
				<PoiMarkers pois={pois[1]} pinColor="#00ff40" />
				<PoiMarkers pois={pois[2]} pinColor="#FFFFFF" />
				<PoiMarkers pois={pois[3]} pinColor="#ff0080" />
				<PoiMarkers pois={pois[4]} pinColor="#00ffff" />
				<PoiMarkers pois={pois[5]} pinColor="#c0c0c0" />
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

// POIマーカーを表示するコンポーネント
const PoiMarkers = (props: { pois: Poi[]; pinColor: string }) => {
	// Add pinColor prop
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
		setActiveMarker(poi); // クリックされたマーカーをアクティブに設定
		setCircleCenter(poi.location); // サークルの中心座標を設定
		setShowCircle(true); // サークルを表示
	}, []);

	// マップクリック時の処理
	const handleMapClick = () => {
		setActiveMarker(null); // アクティブなマーカーをクリア
		setShowCircle(false); // サークルを非表示
	};

	useEffect(() => {
		if (!map) return;

		if (!clusterer.current) {
			clusterer.current = new MarkerClusterer({ map }); // マーカークラスタラーを初期化
		}

		// mapのクリックイベントリスナー
		const listener = map.addListener("click", handleMapClick);


		//  New markers being added
		const newMarkers = props.pois.map((poi: Poi) => new AdvancedMarkerWrapper({
			position: poi.location,
			map: map,
		}).getAdvancedMarker()
		)

		clusterer.current.addMarkers(newMarkers);

		return () => {
			google.maps.event.removeListener(listener);
		};
	}, [map]);

	if (clusterer.current) {
		clusterer.current.clearMarkers();  // Remove markers on unmount/cleanup
	}
};
}, [map, props.pois]); // Add props.pois to the 	return (
<>
	{/* サークルを表示 */}
	{showCircle && (
		<Circle
			radius={500} // サークルの半径
			center={circleCenter}
			strokeColor={"#0c4cb3"} // サークルの線の色
			strokeOpacity={1} // サークルの線の不透明度
			strokeWeight={3} // サークルの線の太さ
			fillColor={"#3b82f6"} // サークルの塗りつぶしの色
			fillOpacity={0.3} // サークルの塗りつぶしの不透明度
			clickable={false} // サークルをクリックできないように設定
		/>
	)}
	{/* POI の数だけマーカーを表示 */}
	{props.pois.map((poi: Poi) => (
		<AdvancedMarker
			key={poi.key}
			position={poi.location}
			zIndex={100} // マーカーのz-indexを設定
			ref={(marker) => setMarkerRef(marker, poi.key)}
			onClick={() => handleClick(poi)}
		>
			<Pin
				background={props.pinColor}
				glyphColor={"#000"}
				borderColor={"#000"}
			/>{" "}
			{/* Use pinColor prop here */}
			{/* アクティブなマーカーの場合は情報ウィンドウを表示 */}
			{activeMarker === poi && (
				<InfoWindow
					position={poi.location}
					pixelOffset={new google.maps.Size(-200, 0)} // 情報ウィンドウの位置を調整
					onCloseClick={() => {
						// 情報ウィンドウを閉じたときの処理
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
};

// アプリケーションのエントリーポイント
export default App;

// DOMにレンダリング
const root = createRoot(document.getElementById("app")!);
root.render(<App />);
