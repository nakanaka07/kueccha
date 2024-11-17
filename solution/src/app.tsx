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
import { usePoiData as useFetchPoiData } from "./usePoiData.js";


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

    const { pois: allPois, loading, error } = useFetchPoiData(areas);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const poisRyotsuAikawa = allPois.filter((poi) => poi.area === "両津・相川地区");
    const poisKanaiSawata = allPois.filter((poi) => poi.area === "金井・佐和田・新穂・畑野・真野地区");
    const poisAkadomariHamochi = allPois.filter((poi) => poi.area === "赤泊・羽茂・小木地区");
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
    const markersRef = useRef<{ [key: string]: AdvancedMarkerWrapper }>({});
    const clusterer = useRef<MarkerClusterer | null>(null);
    const [circleCenter, setCircleCenter] = useState<google.maps.LatLngLiteral | null>(null);
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


    const mapRef = useRef<google.maps.Map | null>(null);
    const visiblePois = useRef<Poi[]>([]);

    useEffect(() => {
        if (!map) return;
        mapRef.current = map;

        const updateVisiblePois = () => {
            if (!mapRef.current) return;
            const bounds = mapRef.current.getBounds();
            if (!bounds) return;

            visiblePois.current = props.pois.filter((poi) => {
                return bounds.contains(poi.location);
            });
        };

        updateVisiblePois();

        const listener = map.addListener("idle", updateVisiblePois);

        return () => {
            google.maps.event.removeListener(listener);
        };
    }, [map, props.pois]);



    useEffect(() => {
        if (!map) return;

        if (!clusterer.current) {
            clusterer.current = new MarkerClusterer({
                map,
                onClusterClick: (cluster) => {
                    const map = clusterer.current!.getMap() as google.maps.Map;
					map.fitBounds(cluster.getBounds());
                }
            });
        }

        const listener = map.addListener("click", handleMapClick);

        return () => {
            google.maps.event.removeListener(listener);
            if (clusterer.current) {
                clusterer.current.clearMarkers();
            }
        };
    }, [map, handleMapClick]);



    useEffect(() => {
		if (!map || !clusterer.current) return;
	}, [map, props.pois]);

    useEffect(() => { // visiblePois の変更で発火
        visiblePois.current.forEach((poi) => {
            if (!markersRef.current[poi.key]) {
                const marker = new google.maps.marker.AdvancedMarkerElement({
                    position: poi.location,
                    map: map,
                });

                markersRef.current[poi.key] = new AdvancedMarkerWrapper({
                    position: marker.position,
                    map: map
                });
            } else {
                markersRef.current[poi.key].getAdvancedMarker().position = poi.location;
                markersRef.current[poi.key].setMap(map);
            }
        });


        for (const key in markersRef.current) {
            const isVisible = visiblePois.current.some(poi => poi.key === key);

            if (!isVisible) {
                markersRef.current[key].setMap(null);
                delete markersRef.current[key];
            }
        }


        clusterer.current.clearMarkers();

        const visibleMarkers = visiblePois.current.map((poi) => markersRef.current[poi.key]?.getAdvancedMarker());

        clusterer.current.addMarkers(visibleMarkers.filter(marker => marker !== undefined));

    }, [map, props.pois, visiblePois.current]);

    return (
        <>
            {showCircle && (
                <Circle
                    radius={500}
                    center={circleCenter}
                    strokeColor="#0c4cb3"
                    strokeOpacity={1}
                    strokeWeight={3}
                    fillColor="#3b82f6"
                    fillOpacity={0.3}
                    clickable={false}
                />
            )}
            {visiblePois.current.map((poi) => (
                <AdvancedMarker
                    key={poi.key}
                    position={poi.location}
                    zIndex={100}
                    onClick={() => handleClick(poi)}
                    aria-label={`Marker for ${poi.name}`}
                >
                    <Pin background={props.pinColor} glyphColor="#000" borderColor="#000" />

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



const usePoiData = (areas: string[]) => {
    const [pois, setPois] = useState<Poi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);


    useEffect(() => {
        abortControllerRef.current = new AbortController(); // AbortController を作成

        const fetchData = async () => {
                try {
                setLoading(true);
                const response = await fetch('your-api-endpoint', { signal: abortControllerRef.current!.signal }); // signal を追加
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPois(data);
            } catch (e: any) {
                if (e.name !== 'AbortError'){
					setError("POIデータの取得に失敗しました。しばらく時間をおいて再度お試しください。"); // より具体的なエラーメッセージ
                    console.error("POI data fetch error:", e); // コンソールにエラーログを出力
                    // 必要であれば、ここで再試行の処理を実装
                }
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        return () => {
            abortControllerRef.current?.abort(); // クリーンアップ関数でキャンセル
        };

    }, [areas]);

    return { pois, loading, error };
};

export default App;


const root = createRoot(document.getElementById("app")!);
root.render(<App />);
