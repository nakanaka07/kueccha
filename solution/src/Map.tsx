// Map.tsx: マップを表示するコンポーネント
import React, { useState, useCallback, memo } from "react";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { MarkerClusterer } from "@react-google-maps/api";
import type { Poi } from "./types.d.ts";
import { MAP_CONFIG, AREA_COLORS, AREAS } from "./appConstants";
import InfoWindowContent from "./InfoWindowContent";

// MapコンポーネントのPropsの型定義
interface MapProps {
    pois: Poi[];
}

// Mapコンポーネント (メモ化)
const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => { // MapPropsに合わせて修正
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
    }, []); // setMapInitializedを削除


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

    return (
        // Google Mapコンポーネント
        <GoogleMap
            onLoad={handleMapLoad} // マップの読み込み時にhandleMapLoadを呼び出す
            mapContainerStyle={MAP_CONFIG.mapContainerStyle} // マップコンテナのスタイル
            center={MAP_CONFIG.defaultCenter} // マップの中心座標
            zoom={MAP_CONFIG.defaultZoom} // マップのズームレベル
            options={{
                mapId: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID,
                disableDefaultUI: false, // デフォルトUIを無効にする場合はtrue
            }}
            onClick={handleMapClick} // マップクリック時にhandleMapClickを呼び出す
        >
            {/* マーカーのクラスタリング */}
            <MarkerClusterer>
                {(clusterer) => (
                    <>
                        {/* マーカーをレンダリング */}
                        {pois.map((poi, index) => ( // keyとしてindexを使用
                            <Marker
                                key={index} // keyにindexを使用
                                position={poi.location}
                                title={poi.name}
                                onClick={() => handleMarkerClick(poi)}
                                clusterer={clusterer}
                                icon={markerIcon(AREA_COLORS[AREAS[poi.area]] || "#000000")} // デフォルトの色
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
                    {/* 情報ウィンドウの内容を表示するコンポーネント */}
                    <InfoWindowContent poi={activeMarker} />
                </InfoWindow>
            )}
        </GoogleMap>
    );
}, (prevProps, nextProps) => prevProps.pois === nextProps.pois); // MapPropsに合わせて修正

export default Map;

