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
  MapCameraChangedEvent,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Circle } from './components/circle.js';

// POI (Point of Interest) の型定義
type Poi = {
  key: string;          // 座標値の欄にする
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
const fetchSpreadsheetData = async (spreadsheetId: string): Promise<Poi[]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:U`, // データ範囲を指定
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    // スプレッドシートのデータをPOI型に変換
    return data.values.map((row: string[]) => ({
      key: row[44],
      location: { lat: parseFloat(row[47]), lng: parseFloat(row[46]) },
      name: row[43],
      category: row[26],
      genre: row[27],
      monday: row[28],
      tuesday: row[29],
      wednesday: row[30],
      thursday: row[31],
      friday: row[32],
      saturday: row[33],
      sunday: row[34],
      holiday: row[35],
      description: row[36],
      reservation: row[37],
      payment: row[38],
      phone: row[39],
      address: row[40],
      information: row[41],
      View: row[42],
    }));
  } catch (error) {
    console.error('Failed to fetch spreadsheet data:', error);
    return [];
  }
};

// アプリケーションのメインコンポーネント
const App = () => {
  const [pois, setPois] = useState<Poi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      const data = await fetchSpreadsheetData(spreadsheetId);
      setPois(data);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <APIProvider apiKey={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY}>
      <Map
        defaultZoom={10}
        defaultCenter={{ lat: 38.00000, lng: 138.4000 }} // 佐渡市内の適当な座標を設定
        mapId={import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID}
      >
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
  const map = useMap();
  const [markers, setMarkers] = useState<{[key: string]: AdvancedMarkerWrapper}>({});
  const clusterer = useRef<MarkerClusterer | null>(null);
  const [circleCenter, setCircleCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [activeMarker, setActiveMarker] = useState<Poi | null>(null);
  const [showCircle, setShowCircle] = useState(false);

  const handleClick = useCallback((poi: Poi) => {
    setActiveMarker(poi);
    setCircleCenter(poi.location);
    setShowCircle(true);
  }, []);

  const handleMapClick = () => {
    setActiveMarker(null);
    setShowCircle(false);
  };

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
    const listener = map.addListener('click', handleMapClick);
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  useEffect(() => {
    if (!clusterer.current) return;
    clusterer.current?.clearMarkers();
    const advancedMarkers = Object.values(markers).map(wrapper =>
      wrapper.getAdvancedMarker());
      clusterer.current.addMarkers(advancedMarkers);
    }, [markers]);

  const setMarkerRef = (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
    if (marker && markers[key]) { return; }
    if (!marker && !markers[key]) { return; }

    setMarkers(prev => {
      if (marker) {
        const wrapper = new AdvancedMarkerWrapper({
          position: marker.position,
          map: map
        });
        return { ...prev, [key]: wrapper };
      } else {
        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      }
    });
  };

  return (
    <>
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
            console.log("マーカーがクリックされました:", poi);
          }}
        >
          <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
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

export default App;

const root = createRoot(document.getElementById('app'));
root.render(
  <App />
);
