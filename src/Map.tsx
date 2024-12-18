// src/Map.tsx
import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { GoogleMap, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Poi } from "./types";
import { MAP_CONFIG, AREA_COLORS, defaultMarkerColor } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

// MapコンポーネントのPropsの型定義
interface MapProps {
    pois: Poi[];
}

const Map: React.FC<MapProps> = ({ pois }: MapProps) => {
    // Google Maps APIの読み込み状態を確認
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID],
        version: "weekly",
        language: "ja",
    });

    // クリックされたマーカーの情報を格納するState
    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

    // GoogleMapインスタンスを格納するRef
    const mapRef = useRef<google.maps.Map | null>(null);
    // MarkerClustererインスタンスを格納するRef
    const markerClusterer = useRef<MarkerClusterer | null>(null);
    // マーカーの配列を格納するRef
    const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);


    // マーカークリック時のコールバック関数
    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    // マップクリック時のコールバック関数
    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    // マーカーのアイコン要素を作成する関数
    const createMarkerElement = useCallback((color: string) => {
        const div = document.createElement("div");
        div.innerHTML = `<img src="https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%98%85|${color}" style="width:30px;height:30px;" />`;
        return div;
    }, []);

    // マーカーを作成する関数
    const createMarkers = useCallback(() => {
        // 既存のマーカーをマップから削除
        markers.current.forEach(marker => marker.setMap(null));
        markers.current = [];

        // 渡されたPOIデータに基づいてマーカーを作成
        pois.forEach(poi => {
            const location = {
                lat: Number(poi.location.lat),
                lng: Number(poi.location.lng),
            };

            const markerColor = AREA_COLORS[poi.area] || defaultMarkerColor;
            const markerElement = createMarkerElement(markerColor);

            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: mapRef.current,
                position: location,
                title: poi.name,
                element: markerElement,
            });

            marker.addListener("click", () => handleMarkerClick(poi));
            markers.current.push(marker);
        });

        // マーカークラスタリングを設定
        if (mapRef.current && markers.current.length > 0) { // markers.current.length > 0 条件を追加
            if (markerClusterer.current) {
                markerClusterer.current.clearMarkers();
                markerClusterer.current.addMarkers(markers.current);
            } else {
                markerClusterer.current = new MarkerClusterer({
                    markers: markers.current,
                    map: mapRef.current,
                });
            }
        } else if (markerClusterer.current) { // markers.current.length == 0 の場合、既存のクラスタをクリア
            markerClusterer.current.clearMarkers();
        }
    }, [pois, createMarkerElement, handleMarkerClick]);

    // Google Maps APIが読み込まれ、poisが変更されたときにマーカーを再作成
    useEffect(() => {
        if (isLoaded) {
            createMarkers();
        }
    }, [isLoaded, createMarkers, pois]);

    // マップコンポーネントをレンダリング
    const mapComponent = useMemo(() => {
        if (!isLoaded) return <div>地図を読み込んでいます...</div>;

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
                onLoad={(map) => { mapRef.current = map; }}
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
    }, [isLoaded, activeMarker, handleMapClick]);


    return mapComponent;
};

export default Map;

