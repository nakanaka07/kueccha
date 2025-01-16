import React, { useState, useCallback, useEffect } from 'react'; // Reactとフックをインポート
import { GoogleMap, useLoadScript } from '@react-google-maps/api'; // Google Map関連のコンポーネントとフックをインポート
import { mapsConfig } from '../../utils/config'; // マップの設定をインポート
import type { MapProps, Poi, AreaType } from '../../utils/types'; // 型定義をインポート
import { Marker } from '../marker/Marker'; // マーカーコンポーネントをインポート
import InfoWindow from '../infowindow/InfoWindow'; // インフォウィンドウコンポーネントをインポート
import { ERROR_MESSAGES } from '../../utils/constants'; // エラーメッセージをインポート

// Mapコンポーネントのプロパティの型定義
interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null; // 選択されたPOI
  setSelectedPoi: (poi: Poi | null) => void; // POIを選択する関数
  areaVisibility: Record<AreaType, boolean>; // エリアの表示状態
  onLoad: () => void; // マップがロードされた後に呼び出される関数
  onCloseFilterPanel: () => void; // フィルターパネルを閉じる関数
}

// Mapコンポーネントの定義
const Map: React.FC<MapComponentProps> = ({
  pois, // POIのリスト
  selectedPoi, // 選択されたPOI
  setSelectedPoi, // POIを選択する関数
  areaVisibility, // エリアの表示状態
  onLoad, // マップがロードされた後に呼び出される関数
  onCloseFilterPanel, // フィルターパネルを閉じる関数
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null); // マップの状態を管理
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey, // Google Maps APIキー
    mapIds: [mapsConfig.mapId], // マップID
    libraries: mapsConfig.libraries, // 使用するライブラリ
  });
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>(
    'terrain', // 初期マップタイプ
  );
  const [isInitialRender, setIsInitialRender] = useState(true); // 初回レンダリングかどうか

  // マップのオプション設定
  const mapOptions = {
    ...mapsConfig.options, // 設定をスプレッド
    mapTypeId: mapType, // マップタイプ
    mapTypeControl: true, // マップタイプコントロールを表示
    zoomControl: true, // ズームコントロールを表示
    mapTypeControlOptions: isLoaded
      ? {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU, // ドロップダウンメニュー
          position: google.maps.ControlPosition.TOP_LEFT, // 左上に配置
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'], // 使用可能なマップタイプ
        }
      : undefined,
    ...(mapsConfig.mapId ? { mapId: mapsConfig.mapId } : {}), // マップIDを設定
  };

  // マップタイプが変更されたときに呼び出される関数
  const handleMapTypeChanged = useCallback(() => {
    if (map) {
      setMapType(map.getMapTypeId() as google.maps.MapTypeId); // マップタイプを更新
    }
  }, [map]);

  // マップがロードされたときに呼び出される関数
  const onLoadMap = useCallback(
    (map: google.maps.Map) => {
      setMap(map); // マップを設定
      map.setMapTypeId('terrain'); // マップタイプを'terrain'に設定
      map.addListener('maptypeid_changed', handleMapTypeChanged); // マップタイプ変更リスナーを追加
      onLoad(); // マップがロードされた後に呼び出す
    },
    [handleMapTypeChanged, onLoad],
  );

  // POI（ポイントオブインタレスト）に基づいてマップの境界を設定する
  useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = new google.maps.LatLngBounds(); // 境界を作成
      pois.forEach((poi) => {
        if (areaVisibility[poi.area]) {
          bounds.extend(poi.location); // 境界を拡張
        }
      });
      if (!isInitialRender) {
        console.log('Fitting bounds:', bounds); // デバッグメッセージ
        map.fitBounds(bounds); // 境界にフィット
        map.panToBounds(bounds); // 境界内にパニング
      } else {
        setIsInitialRender(false);
      }
    }
  }, [map, pois, areaVisibility, isInitialRender]);

  // マーカーがクリックされたときに呼び出される関数
  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi); // 選択されたPOIを設定
    },
    [setSelectedPoi],
  );

  // マップがクリックされたときに呼び出される関数
  const handleMapClick = useCallback(() => {
    console.log('Map clicked'); // デバッグメッセージを追加
    onCloseFilterPanel(); // フィルターパネルを閉じる
  }, [onCloseFilterPanel]);

  // インフォウィンドウが閉じられたときに呼び出される関数
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null); // 選択されたPOIをクリア
  }, [setSelectedPoi]);

  // マップのロードエラーを処理する
  if (loadError) {
    console.error('Maps API loading error:', loadError); // エラーメッセージを表示
    return (
      <div role="alert" aria-live="assertive">
        <h2>{ERROR_MESSAGES.MAP.LOAD_FAILED}</h2> // エラーメッセージ
        <p>{ERROR_MESSAGES.MAP.RETRY_MESSAGE}</p> // リトライメッセージ
      </div>
    );
  }

  // マップがロードされていない場合は何も表示しない
  if (!isLoaded) {
    return null; // nullを返す
  }

  return (
    <div role="region" aria-label="地図" className="map-container">
      <GoogleMap
        center={mapsConfig.defaultCenter} // マップの中心
        zoom={mapsConfig.defaultZoom} // ズームレベル
        options={mapOptions} // マップオプション
        onClick={handleMapClick} // マップクリック時の処理
        onLoad={onLoadMap} // マップロード時の処理
      >
        {map &&
          pois
            .filter((poi) => areaVisibility[poi.area]) // 表示するPOIをフィルタリング
            .map((poi) => (
              <Marker
                key={poi.id} // マーカーのキー
                poi={poi} // POIデータ
                onClick={handleMarkerClick} // マーカークリック時の処理
                map={map} // マップインスタンス
              />
            ))}
        {selectedPoi && (
          <InfoWindow poi={selectedPoi} onCloseClick={handleInfoWindowClose} /> // インフォウィンドウ
        )}
      </GoogleMap>
    </div>
  );
};

Map.displayName = 'Map'; // コンポーネントの表示名を設定

export { Map }; // Mapコンポーネントをエクスポート
export default Map; // デフォルトエクスポート
