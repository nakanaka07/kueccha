import React, { useState, useCallback, useEffect } from 'react'; // Reactと必要なフックをインポート
import { GoogleMap, useLoadScript } from '@react-google-maps/api'; // Google Mapsコンポーネントとフックをインポート
import { mapsConfig } from '../../utils/config'; // 設定をインポート
import type { MapProps, Poi, AreaType, LatLngLiteral } from '../../utils/types'; // 型定義をインポート
import { Marker } from '../marker/Marker'; // Markerコンポーネントをインポート
import InfoWindow from '../infowindow/InfoWindow'; // InfoWindowコンポーネントをインポート
import HamburgerMenu from '../hamburgermenu/HamburgerMenu'; // HamburgerMenuコンポーネントをインポート
import { ERROR_MESSAGES } from '../../utils/constants'; // エラーメッセージ定数をインポート
import { INITIAL_VISIBILITY } from '../filterpanel/FilterPanel'; // 初期表示設定をインポート
import resetNorthIcon from '../../utils/images/ano_icon04.png'; // リセットアイコンをインポート

interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null; // 選択されたPOI
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // POIを設定する関数
  areaVisibility: Record<AreaType, boolean>; // エリアの表示状態
  onLoad: () => void; // マップロード時のコールバック
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >; // エリア表示状態を設定する関数
  currentLocation: LatLngLiteral | null; // 現在の位置
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<LatLngLiteral | null>
  >; // 現在の位置を設定する関数
}

const Map: React.FC<MapComponentProps> = ({
  pois,
  selectedPoi,
  setSelectedPoi,
  areaVisibility,
  onLoad,
  setAreaVisibility,
  currentLocation,
  setCurrentLocation,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null); // マップオブジェクトを管理するステート
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey, // Google Maps APIキー
    mapIds: [mapsConfig.mapId], // マップID
    libraries: mapsConfig.libraries, // 使用するライブラリ
  });
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>(
    'roadmap',
  ); // マップタイプを管理するステート
  const [isInitialRender, setIsInitialRender] = useState(true); // 初期レンダリングかどうかを管理するステート
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null); // 選択されたマーカーIDを管理するステート
  const [localAreaVisibility, setLocalAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY); // ローカルエリアの表示状態を管理するステート

  const mapOptions = {
    ...mapsConfig.options, // マップのオプションを設定
    mapTypeId: mapType, // マップタイプを設定
    mapTypeControl: true, // マップタイプコントロールを有効にする
    zoomControl: true, // ズームコントロールを有効にする
    mapTypeControlOptions: isLoaded
      ? {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU, // ドロップダウンメニューを設定
          position: google.maps.ControlPosition.TOP_LEFT, // コントロールの位置を設定
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'], // 使用するマップタイプを設定
        }
      : undefined,
    ...(mapsConfig.mapId ? { mapId: mapsConfig.mapId } : {}), // マップIDがある場合は設定
  };

  const handleMapTypeChanged = useCallback(() => {
    if (map) {
      setMapType(map.getMapTypeId() as google.maps.MapTypeId); // マップタイプが変更されたときにステートを更新
    }
  }, [map]);

  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance); // マップインスタンスをステートに設定
      onLoad(); // マップロード時のコールバックを実行
    },
    [onLoad],
  );

  const resetNorth = useCallback(() => {
    if (map) {
      map.setHeading(0); // マップの向きを北にリセット
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds(); // マップの境界を設定

      // POIの位置を境界に追加
      pois.forEach((poi) => {
        if (areaVisibility[poi.area]) {
          bounds.extend(poi.location);
        }
      });

      // 現在地が設定されている場合、境界に追加
      if (currentLocation) {
        bounds.extend(currentLocation);
      }

      // フィルターパネルがすべてオフの場合、デフォルトの中心座標を設定
      const allFiltersOff = Object.values(areaVisibility).every(
        (visible) => !visible,
      );
      if (allFiltersOff) {
        map.setCenter(mapsConfig.defaultCenter);
        map.setZoom(mapsConfig.defaultZoom);
      } else {
        if (!isInitialRender) {
          map.fitBounds(bounds); // マップを境界にフィット
          map.panToBounds(bounds); // マップを境界にパン
        } else {
          setIsInitialRender(false); // 初期レンダリングを終了
        }
      }
    }
  }, [map, pois, areaVisibility, isInitialRender, currentLocation]);

  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi); // 選択されたPOIをステートに設定
      setSelectedMarkerId(poi.id); // 選択されたマーカーIDをステートに設定
    },
    [setSelectedPoi],
  );

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null); // 選択されたPOIをリセット
    setSelectedMarkerId(null); // 選択されたマーカーIDをリセット
  }, [setSelectedPoi]);

  useEffect(() => {
    if (map && currentLocation && window.google?.maps) {
      const pin = new google.maps.marker.PinElement({
        glyph: '', // グリフを設定
        background: '#4285F4', // Googleブルー
        borderColor: '#ffffff', // 枠線の色を設定
        scale: 1.2, // スケールを設定
      });

      // スタイルに z-index を追加
      pin.element.style.zIndex = '1000';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: currentLocation, // 現在の位置を設定
        map, // マップを設定
        title: '現在地', // タイトルを設定
        content: pin.element, // コンテンツを設定
      });

      // カスタムプロパティとしてIDを設定
      (marker as any).id = 'current-location-marker';

      // 現在地にズーム
      map.setCenter(currentLocation);
      map.setZoom(15);

      return () => {
        marker.map = null; // マーカーをマップから削除
      };
    }
  }, [map, currentLocation]);

  if (loadError) {
    console.error('Maps API loading error:', loadError); // ロードエラーをコンソールに出力
    return (
      <div role="alert" aria-live="assertive">
        <h2>{ERROR_MESSAGES.MAP.LOAD_FAILED}</h2>
        <p>{ERROR_MESSAGES.MAP.RETRY_MESSAGE}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div>{ERROR_MESSAGES.LOADING.MAP}</div>; // ロード中のメッセージを表示
  }

  return (
    <div role="region" aria-label="地図" className="map-container">
      <GoogleMap
        center={mapsConfig.defaultCenter} // デフォルトの中心座標を設定
        zoom={mapsConfig.defaultZoom} // デフォルトのズームレベルを設定
        options={mapOptions} // マップのオプションを設定
        onLoad={handleMapLoad} // マップロード時のコールバックを設定
      >
        {map &&
          pois
            .filter((poi) => areaVisibility[poi.area]) // 表示するエリアのPOIをフィルタ
            .map((poi) => (
              <Marker
                key={poi.id} // マーカーのキーを設定
                poi={poi} // POIを渡す
                onClick={handleMarkerClick} // クリック時のハンドラを設定
                map={map} // マップを渡す
                isSelected={selectedMarkerId === poi.id} // 選択状態を渡す
              />
            ))}
        {selectedPoi && (
          <InfoWindow
            key={selectedPoi.id} // InfoWindowのキーを設定
            poi={selectedPoi} // POIを渡す
            onCloseClick={handleInfoWindowClose} // 閉じるクリック時のハンドラを設定
          />
        )}
      </GoogleMap>
      <div className="hamburger-menu-container">
        <HamburgerMenu
          pois={pois} // POIを渡す
          setSelectedPoi={setSelectedPoi} // POIを設定する関数を渡す
          setAreaVisibility={setAreaVisibility} // エリア表示状態を設定する関数を渡す
          localAreaVisibility={localAreaVisibility} // ローカルエリアの表示状態を渡す
          setLocalAreaVisibility={setLocalAreaVisibility} // ローカルエリア表示状態を設定する関数を渡す
          currentLocation={currentLocation} // 現在の位置を渡す
          setCurrentLocation={setCurrentLocation} // 現在の位置を設定する関数を渡す
        />
      </div>
      <button
        onClick={resetNorth} // クリック時のハンドラを設定
        style={{
          position: 'absolute', // 絶対位置を設定
          top: '10px', // 上端を10pxに設定
          right: '5px', // 右端を5pxに設定
          background: 'none', // 背景をなしに設定
          border: 'none', // 枠線をなしに設定
        }}
        title="北向きにリセットします。" // ボタンのタイトルを設定
      >
        <img
          src={resetNorthIcon} // アイコンのソースを設定
          alt="北向きにリセット" // 代替テキストを設定
          style={{ width: '50px', height: '50px' }} // アイコンのサイズを設定
        />
      </button>
    </div>
  );
};

Map.displayName = 'Map'; // コンポーネントの表示名を設定

export { Map }; // Mapコンポーネントをエクスポート
export default Map; // デフォルトエクスポート
