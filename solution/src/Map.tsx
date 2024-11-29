// Map.tsx: マップを表示するコンポーネント
import React, { useState, useCallback, memo } from "react";
import { GoogleMap, InfoWindow, Marker, MarkerClusterer } from "@react-google-maps/api"; // useJsApiLoader を削除
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS, AREAS } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

// MapコンポーネントのPropsの型定義
interface MapProps {
    pois: Poi[];
}

// Mapコンポーネント (メモ化)
const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => {
    // useJsApiLoader を削除

    // マップインスタンスを格納するstate
    const [map, setMap] = useState<google.maps.Map | null>(null);
    // クリックされたマーカーの情報を格納するstate
    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

    // マーカークリック時のハンドラ (メモ化)
    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    // マップ読み込み時のハンドラ (メモ化)
    const handleMapLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    // マップクリック時のハンドラ (メモ化)
    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    // マーカーのアイコン設定 (共通化)
    const markerIcon = useCallback((color: string) => ({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: color,
        strokeWeight: 2,
        scale: 12,
    }), []);


    // API が読み込まれていることを前提とするため、読み込み状態の確認は不要


    return (
        <GoogleMap
            onLoad={handleMapLoad}
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
                        {/* マーカーをレンダリング */}
                        {pois.map((poi, index) => (
                            <Marker
                                key={index}
                                position={poi.location}
                                title={poi.name}
                                onClick={() => handleMarkerClick(poi)}
                                icon={markerIcon(AREA_COLORS[AREAS[poi.area]] || "#000000")}
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
}, (prevProps, nextProps) => prevProps.pois === nextProps.pois);


export default Map;
