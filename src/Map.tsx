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

// Mapコンポーネントのプロパティを定義
interface MapProps {
    pois: Poi[]; // 表示するPOIの配列
}

// デフォルトのマーカー色
const defaultMarkerColor = "#000000";

// 必要なライブラリを指定
const libraries: Libraries = ["marker"];

// Mapコンポーネントをメモ化。propsが変更された場合のみ再レンダリング
const Map: React.FC<MapProps> = memo(({ pois }: MapProps) => {
    // Google Maps APIの読み込み状態を確認
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script", // scriptタグのID
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // APIキー
        libraries, // 必要なライブラリ
        mapIds: [import.meta.env.VITE_GOOGLE_MAPS_MAP_ID], // mapId
        version: "weekly", // APIのバージョン
        language: 'ja', // マップの言語を日本語に設定
    });

    // クリックされたマーカーを管理するstate
    const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

    // MarkerClustererのインスタンスを管理するstate
    const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);

    // マーカークリック時のハンドラ。クリックされたマーカーをactiveMarkerに設定
    const handleMarkerClick = useCallback((poi: Poi) => {
        setActiveMarker(poi);
    }, []);

    // マップクリック時のハンドラ。activeMarkerをnullに設定してInfoWindowを閉じる
    const handleMapClick = useCallback(() => {
        setActiveMarker(null);
    }, []);

    // マーカーコンテンツを作成する関数。色付きの円を作成
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

    // GoogleMapコンポーネントをメモ化。isLoaded, pois, handleMapClick, createMarkerContent, activeMarkerが変更された場合のみ再レンダリング
    const map = useMemo(() => {
        // APIが読み込まれていない場合はローディングメッセージを表示
        if (!isLoaded) return <div>Loading...</div>;

        return (
            <GoogleMap
                mapContainerStyle={MAP_CONFIG.mapContainerStyle} // マップコンテナのスタイル
                center={MAP_CONFIG.defaultCenter} // マップの中心座標
                zoom={MAP_CONFIG.defaultZoom} // マップのズームレベル
                options={{ // マップのオプション
                    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // mapIdを設定
                    disableDefaultUI: false, // デフォルトUIを無効にするかどうか
                    clickableIcons: false, // マーカーのアイコンをクリック可能にするかどうか
                }}
                onLoad={(map) => { // マップの読み込みが完了した時に実行されるコールバック
                    // マーカーを作成
                    const markers = pois.map(poi => {
                        // エリアに対応する色を取得。存在しない場合はデフォルト色を使用
                        const markerColor = AREA_COLORS[AREAS[poi.area]] || defaultMarkerColor;
                        const markerElement = new google.maps.marker.AdvancedMarkerElement({
                            map, // mapインスタンス
                            position: poi.location, // マーカーの位置
                            title: poi.name, // マーカーのタイトル
                            content: createMarkerContent(markerColor), // マーカーのコンテンツ
                        });
                        // マーカークリック時のイベントリスナーを追加
                        markerElement.addListener("click", () => handleMarkerClick(poi));
                        return markerElement; // マーカーを返す
                    });


                    // 既存のMarkerClustererがあればクリア
                    if (markerClusterer) {
                        markerClusterer.clearMarkers();
                    }

                    // 新しいMarkerClustererを作成
                    const newMarkerClusterer = new MarkerClusterer({ map, markers });

                    // MarkerClustererのインスタンスをstateに保存
                    setMarkerClusterer(newMarkerClusterer);
                }}
                onClick={handleMapClick} // マップクリック時のハンドラ
            >
                {/* activeMarkerがあればInfoWindowを表示 */}
                {activeMarker && (
                    <InfoWindow
                        position={activeMarker.location} // InfoWindowの位置
                        onCloseClick={() => setActiveMarker(null)} // InfoWindowを閉じるハンドラ
                    >
                        <InfoWindowContent poi={activeMarker} />
                        {/* InfoWindowの内容 */}
                    </InfoWindow>
                )}
            </GoogleMap>
        );
    }, [isLoaded, pois, handleMapClick, createMarkerContent, activeMarker, markerClusterer]); // 依存配列

    return map; // マップを返す
});


export default Map;
