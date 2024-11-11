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

// 必要なモジュールをインポート
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  APIProvider,
  Map,
  useMap,
  AdvancedMarker,
  MapCameraChangedEvent,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Circle } from './components/circle.js'

// POI (Point of Interest) の型定義
type Poi = { key: string, location: google.maps.LatLngLiteral }

// POIのデータ (シドニーの観光スポット)
const locations: Poi[] = [
  { key: 'operaHouse', location: { lat: -33.8567844, lng: 151.213108 } }, // オペラハウス
  { key: 'tarongaZoo', location: { lat: -33.8472767, lng: 151.2188164 } }, // タロンガ動物園
  { key: 'manlyBeach', location: { lat: -33.8209738, lng: 151.2563253 } }, // マンリービーチ
  { key: 'hyderPark', location: { lat: -33.8690081, lng: 151.2052393 } }, // ハイドパーク
  { key: 'theRocks', location: { lat: -33.8587568, lng: 151.2058246 } }, // ロックス
  { key: 'circularQuay', location: { lat: -33.858761, lng: 151.2055688 } }, // サーキュラーキー
  { key: 'harbourBridge', location: { lat: -33.852228, lng: 151.2038374 } }, // ハーバーブリッジ
  { key: 'kingsCross', location: { lat: -33.8737375, lng: 151.222569 } }, // キングスクロス
  { key: 'botanicGardens', location: { lat: -33.864167, lng: 151.216387 } }, // 王立植物園
  { key: 'museumOfSydney', location: { lat: -33.8636005, lng: 151.2092542 } }, // シドニー博物館
  { key: 'maritimeMuseum', location: { lat: -33.869395, lng: 151.198648 } }, // 海事博物館
  { key: 'kingStreetWharf', location: { lat: -33.8665445, lng: 151.1989808 } }, // キングストリートワーフ
  { key: 'aquarium', location: { lat: -33.869627, lng: 151.202146 } }, // 水族館
  { key: 'darlingHarbour', location: { lat: -33.87488, lng: 151.1987113 } }, // ダーリングハーバー
  { key: 'barangaroo', location: { lat: -33.8605523, lng: 151.1972205 } }, // バランガルー
];

// AdvancedMarkerElementをラップするクラス
class AdvancedMarkerWrapper {
  private advancedMarker: google.maps.marker.AdvancedMarkerElement;

  constructor(options: google.maps.marker.AdvancedMarkerElementOptions) {
    // AdvancedMarkerElementのインスタンスを作成
    this.advancedMarker = new google.maps.marker.AdvancedMarkerElement(options);
  }

  // AdvancedMarkerElementのメソッドやプロパティにアクセスするためのメソッド
  getPosition() {
    // 位置情報を取得
    return this.advancedMarker.position;
  }

  setMap(map: google.maps.Map | null) {
    // 地図を設定
    this.advancedMarker.map = map;
  }

  // MarkerClustererで必要な他のメソッドを追加
  // ...

  // AdvancedMarkerElementを取得するメソッド
  getAdvancedMarker() {
    return this.advancedMarker;
  }
}

// アプリケーションのメインコンポーネント
const App = () => (
  // APIキーを提供
  <APIProvider apiKey={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY} onLoad={() => console.log('Maps API has loaded.')}>
    {/* 地図コンポーネント */}
    <Map
      // 初期ズームレベル
      defaultZoom={13}
      // 地図の中心の初期座標
      defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
      // カメラ変更時のイベントハンドラ
      onCameraChanged={(ev: MapCameraChangedEvent) =>
        console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
      }
      // 地図ID
      mapId={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID}
    >
      {/* POIマーカーコンポーネント */}
      <PoiMarkers pois={locations} />
    </Map>
  </APIProvider>
);

// POIマーカーを表示するコンポーネント
const PoiMarkers = (props: { pois: Poi[] }) => {
  // 地図インスタンスを取得
  const map = useMap();
  // マーカーの状態を管理するstate（AdvancedMarkerWrapperを使用）
  const [markers, setMarkers] = useState<{[key: string]: AdvancedMarkerWrapper}>({});
  // マーカークラスタラーのインスタンスを格納するref
  const clusterer = useRef<MarkerClusterer | null>(null);
  // 円の中心の座標を管理するstate
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLngLiteral | null>(null);
  // 現在アクティブなマーカーを管理するstate
  const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
  // 円を表示するかどうかの状態を管理するstate
  const [showCircle, setShowCircle] = useState(false);

  // マーカークリック時のイベントハンドラ
  const handleClick = useCallback((poi: Poi) => {
    // アクティブなマーカーを更新
    setActiveMarker(poi);
    // 円の中心を更新
    setCircleCenter(poi.location);
    // 円を表示
    setShowCircle(true);
  }, []);

  // 地図クリック時のイベントハンドラ
  const handleMapClick = () => {
    // アクティブなマーカーをクリア
    setActiveMarker(null);
    // 円を非表示
    setShowCircle(false);
  };

  // 地図が変更されたら、MarkerClustererを初期化
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      // MarkerClustererのインスタンスを作成
      clusterer.current = new MarkerClusterer({ map });
    }
    // 地図クリックイベントリスナーを追加
    const listener = map.addListener('click', handleMapClick);
    // クリーンアップ関数でリスナーを削除
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  // マーカーの状態が変更されたら、クラスタラーの表示を更新
  useEffect(() => {
    if (!clusterer.current) return;
    // クラスタ内のマーカーをクリア
    clusterer.current?.clearMarkers();
    // AdvancedMarkerWrapperからAdvancedMarkerElementを取得
    const advancedMarkers = Object.values(markers).map(wrapper =>
      wrapper.getAdvancedMarker());
    // AdvancedMarkerElementをクラスタに追加
      clusterer.current.addMarkers(advancedMarkers);
    }, [markers]);

  // マーカーのrefを設定する関数
  const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
    // 既にマーカーが存在する場合は何もしない
    if (marker && markers[key]) { return; }
    // マーカーが存在しない場合は何もしない
    if (!marker && !markers[key]) { return; }

    setMarkers(prev => {
      if (marker) {
        // AdvancedMarkerWrapperのインスタンスを作成
        const wrapper = new AdvancedMarkerWrapper({
          position: marker.position, // 位置情報
          map: map // 地図
        });
        // マーカーをstateに追加
        return { ...prev, [key]: wrapper };
      } else {
        // マーカーをstateから削除
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  return (
    <>
      {/* 円の表示 */}
      {showCircle && (
        <Circle
          radius={500} // 円の半径
          center={circleCenter} // 円の中心座標
          strokeColor={'#0c4cb3'} // 円の線の色
          strokeOpacity={1} // 円の線の不透明度
          strokeWeight={3} // 円の線の太さ
          fillColor={'#3b82f6'} // 円の塗りつぶしの色
          fillOpacity={0.3} // 円の塗りつぶしの不透明度
          // 円のクリックを無効にする
        clickable={false}
        />
      )}
      {/* POIのリストをマッピングして、マーカーを表示 */}
      {props.pois.map((poi: Poi) => (
        <AdvancedMarker
          key={poi.key} // マーカーのキー
          position={poi.location} // マーカーの座標
          ref={marker => {
            // マーカーのrefを設定
            setMarkerRef(marker, poi.key);
          }}
          onClick={() => handleClick(poi)} // マーカークリック時のイベントハンドラ
        >
          {/* マーカーのピン */}
          <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
          {/* アクティブなマーカーの場合、情報ウィンドウを表示 */}
          {activeMarker === poi && (
            <InfoWindow
              position={poi.location} // 情報ウィンドウの座標
              onCloseClick={() => {
                setActiveMarker(null); // アクティブなマーカーをクリア
                setShowCircle(false); // InfoWindowを閉じるときに円を閉じる
              }}
            >
              <div>
                <h2>{poi.key}</h2>
                {/* POIに関する追加情報をここに表示 */}
              </div>
            </InfoWindow>
          )}
        </AdvancedMarker>
      ))}
    </>
  );
};

export default App;

// アプリケーションのエントリポイント
const root = createRoot(document.getElementById('app'));
root.render(
  <App />
);
