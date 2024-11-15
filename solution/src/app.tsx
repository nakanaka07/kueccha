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

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  APIProvider,
  Map,
  useMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Circle } from './components/circle.js';


// POI (Point of Interest) データのインターフェース
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

// メインアプリケーションコンポーネント
const App = () => {
  const [pois, setPois] = useState<Poi[]>([]);  // POIデータ
  const [loading, setLoading] = useState(true); // ローディング状態
  const [error, setError] = useState<string | null>(null); // エラー状態

  useEffect(() => {
        // スプレッドシートID、APIキー、シート名
    const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
    const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    const sheetName = '両津・相川地区';

    // 環境変数のチェック
    if (!spreadsheetId || !apiKey) {
      setError("Spreadsheet ID or API Key is missing.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
                // スプレッドシートデータの取得
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A:AY?key=${apiKey}`
        );

                // レスポンスのエラーチェック
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP error! status: ${response.status} ${errorData.error.message}`);
        }

        const data = await response.json();

        // データの存在チェック
        if (!data.values) {
          throw new Error('スプレッドシートのデータが取得できませんでした');
        }

                // POIデータの変換
        const poiData = data.values.slice(1).map((row: any[]) => {
          const lat = parseFloat(row[47]);
          const lng = parseFloat(row[46]);

          return {
            key: row[44] ?? '',
            location: { lat: isNaN(lat) ? 0 : lat, lng: isNaN(lng) ? 0 : lng },
            name: row[43] ?? '',
            category: row[26] ?? '',
            genre: row[27] ?? '',
            monday: row[28] ?? '',
            tuesday: row[29] ?? '',
            wednesday: row[30] ?? '',
            thursday: row[31] ?? '',
            friday: row[32] ?? '',
            saturday: row[33] ?? '',
            sunday: row[34] ?? '',
            holiday: row[35] ?? '',
            description: row[36] ?? '',
            reservation: row[37] ?? '',
            payment: row[38] ?? '',
            phone: row[39] ?? '',
            address: row[40] ?? '',
            information: row[41] ?? '',
            view: row[42] ?? '',
          };
        });

        setPois(poiData);

      } catch (error: any) {
        setError(error.message);
        console.error('スプレッドシートデータの取得中にエラーが発生しました:', error);
        setPois([]);
      } finally {
        setLoading(false);
      }
    };
    
    setLoading(true); // useEffect 内で一度だけ setLoading(true) を呼ぶ
    loadData();
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
        <PoiMarkers pois={pois} /> {/* POIマーカーコンポーネント */}
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
const PoiMarkers = (props: { pois: Poi[] }) => {
  const map = useMap(); // map オブジェクトを取得
  const [markers, setMarkers] = useState<{[key: string]: AdvancedMarkerWrapper}>({}); // マーカーの状態を管理
  const clusterer = useRef<MarkerClusterer | null>(null); // マーカークラスタラー
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLngLiteral | null>(null); // サークルの中心座標
  const [activeMarker, setActiveMarker] = useState<Poi | null>(null); // クリックされたマーカー
  const [showCircle, setShowCircle] = useState(false); // サークルの表示状態

  // マーカークリック時の処理
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
    if (!map) return; // map オブジェクトがなければ何もしない

    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map }); // マーカークラスタラーを初期化
    }

    // mapのクリックイベントリスナー
    const listener = map.addListener('click', handleMapClick);

    // クリーンアップ関数 : イベントリスナーを削除
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  // マーカーの状態が変更されたときの処理
  useEffect(() => {
    if (!clusterer.current) return;

    clusterer.current.clearMarkers(); // クラスタリングをクリア

    const advancedMarkers = Object.values(markers).map(wrapper => wrapper.getAdvancedMarker());
    clusterer.current.addMarkers(advancedMarkers); // マーカーをクラスタリングに追加
  }, [markers]);

    // マーカーの参照を設定
  const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
    if (marker && markers[key]) return; // 既にマーカーが設定されている場合は何もしない
    if (!marker && !markers[key]) return; // マーカーが設定されていない場合は何もしない

    setMarkers(prev => {
      if (marker) {
        const wrapper = new AdvancedMarkerWrapper({ // マーカーをラップ
          position: marker.position,
          map: map,
        });
        return { ...prev, [key]: wrapper }; // マーカーを追加
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key]; // マーカーを削除
        return newMarkers;
      }
    });
  };


  return (
    <>
      {/* サークルを表示 */}
      {showCircle && (
        <Circle
          radius={500} // サークルの半径
          center={circleCenter}
          strokeColor={'#0c4cb3'} // サークルの線の色
          strokeOpacity={1} // サークルの線の不透明度
          strokeWeight={3} // サークルの線の太さ
          fillColor={'#3b82f6'} // サークルの塗りつぶしの色
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
          ref={marker => setMarkerRef(marker, poi.key)}
          onClick={() => handleClick(poi)}
        >
          <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} /> {/* マーカーのアイコン */}
          {/* アクティブなマーカーの場合は情報ウィンドウを表示 */}
          {activeMarker === poi && (
            <InfoWindow
              position={poi.location}
              pixelOffset={new google.maps.Size(0, -40)} // 情報ウィンドウの位置を調整
              onCloseClick={() => { // 情報ウィンドウを閉じたときの処理
                setActiveMarker(null);
                setShowCircle(false);
              }}
            >
              <div>
                <h2>{poi.name}</h2>
                <p>{poi.description}</p>
                {/* 他のプロパティも必要に応じて表示 */}
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
const root = createRoot(document.getElementById('app')!);
root.render(<App />);
