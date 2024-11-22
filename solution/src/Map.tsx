// Map.tsx: マップを表示するコンポーネント
import React, { useState, useCallback, memo, useMemo } from "react";
import {
  GoogleMap,
  InfoWindow,
  AdvancedMarkerElement,
} from "@react-google-maps/api"; // Google Maps API 関連のコンポーネント
import { MarkerClusterer } from "@react-google-maps/marker-clusterer"; // マーカークラスタリングライブラリ
import type { Poi } from "./types.d.ts"; // POI の型定義
import { MAP_CONFIG, AREA_COLORS } from "./appConstants"; // マップの設定とエリアごとの色
import InfoWindowContent from "./InfoWindowContent"; // 情報ウィンドウのコンテンツ

interface MapProps {
  pois: Poi[]; // POI の配列
}

const Map: React.FC<MapProps> = ({ pois }) => {
  // クリックされたマーカーを格納する状態
  const [activeMarker, setActiveMarker] = useState<Poi | null>(null);

  // マーカークリック時のコールバック関数
  const handleMarkerClick = useCallback((poi: Poi) => {
    setActiveMarker(poi); // クリックされたマーカーをアクティブに設定
  }, []);

  // マーカークラスタのオプション
  const markerClustererOptions = useMemo(
    () => ({
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
    }),
    []
  );

  // マーカーの配列を生成。pois が変更されたときのみ再計算
  const markers = useMemo(
    () =>
      pois.map((poi) => {
        // エリアに基づいてマーカーの色を設定
        const markerColor =
          AREA_COLORS[poi.area as keyof typeof AREA_COLORS] || "#000000";
        // マーカーのアイコンを設定
        const icon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: markerColor,
          strokeWeight: 2,
          scale: 10,
        };
        return { poi, icon };
      }),
    [pois]
  );

  // 開発モードでのみコンソールログを出力
  if (import.meta.env.MODE === 'development') {
    console.log("Map レンダリング", pois);
  }

  // Google Map を表示
  return (
    <GoogleMap
      // onLoad={handleMapLoad} // 必要がなければ削除可能
      mapContainerStyle={MAP_CONFIG.mapContainerStyle} // マップコンテナのスタイル
      center={MAP_CONFIG.defaultCenter} // マップの中心座標
      zoom={MAP_CONFIG.defaultZoom} // 初期ズームレベル
      options={{
        mapId: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID,
        disableDefaultUI: true, // デフォルトの UI を無効化
        zoomControl: true, // ズームコントロールを表示
      }}
    >
      {/* マーカーをクラスタリングして表示 */}
      <MarkerClusterer options={markerClustererOptions}>
        {(clusterer) =>
          markers.map(({ poi, icon }) => (
            <AdvancedMarkerElement // マーカーコンポーネント
              key={poi.id} // キーとして poi.id を使用
              position={{
                lat: poi.location.lat,
                lng: poi.location.lng,
              }} // マーカーの位置
              title={poi.name} // マーカーのタイトル
              onClick={() => handleMarkerClick(poi)} // クリックイベントハンドラ
              clusterer={clusterer} // クラスタリングオブジェクト
              icon={icon} // マーカーのアイコン
            />
          ))
        }
      </MarkerClusterer>

      {/* アクティブなマーカーがあれば情報ウィンドウを表示 */}
      {activeMarker && (
        <InfoWindow // 情報ウィンドウ
          position={{
            lat: activeMarker.location.lat,
            lng: activeMarker.location.lng,
          }} // 情報ウィンドウの位置
          onCloseClick={() => setActiveMarker(null)} // 閉じるボタンクリック時のハンドラ
        >
          <InfoWindowContent poi={activeMarker} />{" "}
          {/* 情報ウィンドウのコンテンツ */}
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

// メモ化することで不要な再レンダリングを防ぐ。propsの比較を最適化
export default memo(Map, (prevProps, nextProps) => prevProps.pois.length === nextProps.pois.length);
