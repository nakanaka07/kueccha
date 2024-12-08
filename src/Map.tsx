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
const libraries: Libraries = ["marker"];  // 使用するライブラリ

const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => {
    // Google Maps APIの読み込み状態
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries,
        mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID],
        version: "weekly",
        language: 'ja', // 日本語設定
    });

    // アクティブなマーカーの状態
    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
    // マーカークラスタラーの状態
    const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);


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
        // APIが読み込み完了していない場合はローディング表示
        if (!isLoaded) return <div>Loading...</div>;

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
                    // マーカーの作成
                    const markers = pois.map(poi => {
                        const markerColor = AREA_COLORS[AREAS[poi.area]] || defaultMarkerColor;
                        const markerElement = new google.maps.marker.AdvancedMarkerElement({
                            map,
                            position: poi.location,
                            title: poi.name,
                            content: createMarkerContent(markerColor),
                        });
                        markerElement.addListener("click", () => handleMarkerClick(poi));
                        return markerElement;
                    });

                    // 既存のクラスタをクリア
                    if (markerClusterer) {
                        markerClusterer.clearMarkers();
                    }

                    // 新しいクラスタを作成
                    const newMarkerClusterer = new MarkerClusterer({ map, markers });
                    setMarkerClusterer(newMarkerClusterer);
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
    }, [isLoaded, pois, handleMapClick, createMarkerContent, activeMarker, markerClusterer]);

    return map;
});

export default Map;
