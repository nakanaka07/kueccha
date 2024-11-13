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

// POI (Point of Interest) の型定義
type Poi = {
  key: string;          // 座標値にする
  location: google.maps.LatLngLiteral;    // 緯度と経度
  name: string;         // 名称
  category: string;     // カテゴリー
  genre: string;        // ジャンル
  monday: string;       // 月曜日
  tuesday: string;      // 火曜日
  wednesday: string;    // 水曜日
  thursday: string;     // 木曜日
  friday: string;       // 金曜日
  saturday: string;     // 土曜日
  sunday: string;       // 日曜日
  holiday: string;      // 祝日
  description: string;  // 説明
  reservation: string;  // 予約
  payment: string;      // 支払
  phone: string;        // 問い合わせ
  address: string;      // 所在地
  information: string;  // 関連情報
  View: string;         // Googleマップで見る
};

// スプレッドシートからデータを取得する関数
const fetchSpreadsheetData = async (spreadsheetId: string): Promise<Poi[] | Error> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:AY?gid=95850266`, // シートIDとデータ範囲を修正
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
      }

    const data = await response.json();
    if (!data.values) {
      throw new Error('スプレッドシートのデータが取得できませんでした');
    }

    // スプレッドシートのデータをPOI型に変換
    return data.values.map((row: string[]) => {
      // 各項目の型を検証
      const lat = parseFloat(row[47]);
      if (isNaN(lat)) {
        throw new Error(`緯度の値が不正です: ${row[47]}`);
      }
      const lng = parseFloat(row[46]);
      if (isNaN(lng)) {
        throw new Error(`経度の値が不正です: ${row[46]}`);
      }

      // key は string 型なので、特に検証は不要です
      const key = row[44];

      // location は { lat: number, lng: number } 型なので、lat と lng の検証で十分です

      // name, category, genre, monday から View まではすべて string 型なので、特に検証は不要です
      const name = row[43];
      const category = row[26];
      const genre = row[27];
      const monday = row[28];
      const tuesday = row[29];
      const wednesday = row[30];
      const thursday = row[31];
      const friday = row[32];
      const saturday = row[33];
      const sunday = row[34];
      const holiday = row[35];
      const description = row[36];
      const reservation = row[37];
      const payment = row[38];
      const phone = row[39];
      const address = row[40];
      const information = row[41];
      const View = row[42];

      return {
        key,
        location: { lat, lng },
        name,
        category,
        genre,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        holiday,
        description,
        reservation,
        payment,
        phone,
        address,
        information,
        View,
      };
    })
    .catch((error) => {
      console.error('エラーが発生しました:', error);
      return [];

// アプリケーションのメインコンポーネント
const App = () => {
  // POI の状態を管理する state
  const [pois, setPois] = useState<Poi[]>([]);
  // ロード状態を管理する state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データを非同期でロードする関数
    const loadData = async () => {
      // ロード開始
      setLoading(true);
      // スプレッドシート ID を環境変数から取得
      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      // スプレッドシートデータを取得
      const data = await fetchSpreadsheetData(spreadsheetId);
      // 取得したデータを state に設定
      setPois(data);
      // ロード終了
      setLoading(false);
    };

    // コンポーネントがマウントされたときにデータロードを実行
    loadData();
  }, []);

  // ロード中の場合はローディングメッセージを表示
  if (loading) {
    return <div>Loading...</div>;
  }

  // Google Maps を表示
  return (
    <APIProvider apiKey={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY}>
      <Map
        defaultZoom={10}
        defaultCenter={{ lat: 38.00000, lng: 138.4000 }} // 佐渡市内の適当な座標を設定
        mapId={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID}
      >
        {/* POI マーカーを表示するコンポーネント */}
        <PoiMarkers pois={pois} />
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
  // マップオブジェクトを取得
  const map = useMap();
  // マーカーの状態を管理する state
  const [markers, setMarkers] = useState<{[key: string]: AdvancedMarkerWrapper}>({});
  // マーカークラスタラーのインスタンスを保持する ref
  const clusterer = useRef<MarkerClusterer | null>(null);
  // サークルの状態を管理する state
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLngLiteral | null>(null);
  // アクティブなマーカーの状態を管理する state
  const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
  // サークルの表示状態を管理する state
  const [showCircle, setShowCircle] = useState(false);

  // マーカークリック時の処理
  const handleClick = useCallback((poi: Poi) => {
    // アクティブなマーカーを設定
    setActiveMarker(poi);
    // サークルの位置を設定
    setCircleCenter(poi.location);
    // サークルを表示
    setShowCircle(true);
  }, []);

  // マップクリック時の処理
  const handleMapClick = () => {
    // アクティブなマーカーをクリア
    setActiveMarker(null);
    // サークルを非表示
    setShowCircle(false);
  };

  // マップオブジェクトが変更されたときの処理
  useEffect(() => {
    // マップオブジェクトがない場合は何もしない
    if (!map) return;
    // マーカークラスタラーが初期化されていない場合は初期化する
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
    // マップクリックイベントリスナーを追加
    const listener = map.addListener('click', handleMapClick);
    // クリーンアップ関数でイベントリスナーを削除
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  // マーカーの状態が変更されたときの処理
  useEffect(() => {
    // マーカークラスタラーが初期化されていない場合は何もしない
    if (!clusterer.current) return;
    // クラスタリングをクリア
    clusterer.current?.clearMarkers();
    // マーカーの配列を取得
    const advancedMarkers = Object.values(markers).map(wrapper =>
      wrapper.getAdvancedMarker());
    // マーカーをクラスタリングに追加
    clusterer.current.addMarkers(advancedMarkers);
  }, [markers]);

  // マーカーの参照を設定する関数
  const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
    // 既にマーカーが設定されている場合は何もしない
    if (marker && markers[key]) { return; }
    // マーカーが設定されていない場合は何もしない
    if (!marker && !markers[key]) { return; }

    // マーカーの状態を更新
    setMarkers(prev => {
      // マーカーが設定されている場合はマーカーを追加
      if (marker) {
        const wrapper = new AdvancedMarkerWrapper({
          position: marker.position,
          map: map
        });
        return { ...prev, [key]: wrapper };
      } else {
        // マーカーが設定されていない場合はマーカーを削除
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  // マーカーとサークルを表示
  return (
    <>
      {/* サークルを表示 */}
      {showCircle && (
        <Circle
          radius={500}
          center={circleCenter}
          strokeColor={'#0c4cb3'}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={'#3b82f6'}
          fillOpacity={0.3}
          clickable={false}
        />
      )}
      {/* POI の数だけマーカーを表示 */}
      {props.pois.map((poi: Poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          zIndex={100}
          ref={marker => {
            setMarkerRef(marker, poi.key);
          }}
          onClick={() => {
            handleClick(poi);
          }}
        >
          {/* マーカーのアイコン */}
          <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
          {/* アクティブなマーカーの場合は情報ウィンドウを表示 */}
          {activeMarker === poi && (
            <InfoWindow
              position={poi.location}
              pixelOffset={new google.maps.Size(0, -40)}
              onCloseClick={() => {
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

// DOM にレンダリング
const root = createRoot(document.getElementById('app'));
root.render(
  <App />
);
