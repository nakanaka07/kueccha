import React, { useState, useCallback, useEffect } from 'react'; // Reactと必要なフックをインポート
import { GoogleMap, useLoadScript } from '@react-google-maps/api'; // Google Maps APIのフックをインポート
import { mapsConfig } from '../../utils/config'; // マップの設定をインポート
import type { MapProps, Poi, AreaType, LatLngLiteral } from '../../utils/types'; // 型定義をインポート
import { Marker } from '../marker/Marker'; // マーカーコンポーネントをインポート
import InfoWindow from '../infowindow/InfoWindow'; // インフォウィンドウコンポーネントをインポート
import HamburgerMenu from '../hamburgermenu/HamburgerMenu'; // ハンバーガーメニューコンポーネントをインポーネット
import { ERROR_MESSAGES } from '../../utils/constants'; // エラーメッセージ定数をインポート
import { INITIAL_VISIBILITY } from '../filterpanel/FilterPanel'; // 初期表示設定をインポート
import resetNorthIcon from '../../utils/images/ano_icon04.png'; // 北向きリセットボタンのアイコンをインポート
import currentLocationIcon from '../../utils/images/shi_icon04.png'; // 現在地取得ボタンのアイコンをインポート

interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null; // 選択されたPOI
  setSelectedPoi: React.Dispatch<React.SetStateAction<Poi | null>>; // 選択されたPOIを設定する関数
  areaVisibility: Record<AreaType, boolean>; // エリアの表示状態
  onLoad: () => void; // マップロード時のコールバック
  setAreaVisibility: React.Dispatch<
    React.SetStateAction<Record<AreaType, boolean>>
  >; // エリアの表示状態を設定する関数
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
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null); // 選択されたマーカーのIDを管理するステート
  const [localAreaVisibility, setLocalAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY); // ローカルエリアの表示状態を管理するステート

  const mapOptions = {
    ...mapsConfig.options,
    mapTypeId: mapType,
    mapTypeControl: true,
    zoomControl: true,
    mapTypeControlOptions: isLoaded
      ? {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_LEFT,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
        }
      : undefined,
    ...(mapsConfig.mapId ? { mapId: mapsConfig.mapId } : {}),
  }; // マップのオプションを設定

  const handleMapTypeChanged = useCallback(() => {
    if (map) {
      setMapType(map.getMapTypeId() as google.maps.MapTypeId); // マップタイプが変更されたときにステートを更新
    }
  }, [map]);

  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance); // マップオブジェクトをステートに設定
      onLoad(); // マップロード時のコールバックを呼び出し
    },
    [onLoad],
  );

  const resetNorth = useCallback(() => {
    if (map) {
      map.setHeading(0); // マップの向きを北にリセット
    }
  }, [map]);

  const handleGetCurrentLocation = useCallback(() => {
    if (currentLocation) {
      // 現在地が既に表示されている場合は非表示にする
      setCurrentLocation(null);
      setLocalAreaVisibility((prev) => ({
        ...prev,
        CURRENT_LOCATION: false,
      }));
    } else {
      // 現在地を取得して表示する
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            setLocalAreaVisibility((prev) => ({
              ...prev,
              CURRENT_LOCATION: true,
            }));
          },
          (error) => {
            console.error('Error getting current location:', error);
            alert('現在地の取得に失敗しました。');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      } else {
        alert('このブラウザは現在地取得に対応していません。');
      }
    }
  }, [currentLocation, setCurrentLocation, setLocalAreaVisibility]);

  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();

      pois.forEach((poi) => {
        if (areaVisibility[poi.area]) {
          bounds.extend(poi.location); // POIの位置をバウンドに追加
        }
      });

      if (currentLocation) {
        bounds.extend(currentLocation); // 現在地をバウンドに追加
      }

      const allFiltersOff = Object.values(areaVisibility).every(
        (visible) => !visible,
      );
      if (allFiltersOff) {
        map.setCenter(mapsConfig.defaultCenter); // 全てのフィルターがオフの場合はデフォルトの中心に設定
        map.setZoom(mapsConfig.defaultZoom); // デフォルトのズームレベルに設定
      } else {
        if (!isInitialRender) {
          map.fitBounds(bounds); // バウンドにフィット
          map.panToBounds(bounds); // バウンドにパン
        } else {
          setIsInitialRender(false); // 初期レンダリングフラグをオフに設定
        }
      }
    }
  }, [map, pois, areaVisibility, isInitialRender, currentLocation]);

  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi); // 選択されたPOIをステートに設定
      setSelectedMarkerId(poi.id); // 選択されたマーカーのIDをステートに設定
    },
    [setSelectedPoi],
  );

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null); // 選択されたPOIをクリア
    setSelectedMarkerId(null); // 選択されたマーカーのIDをクリア
  }, [setSelectedPoi]);

  if (loadError) {
    return <div>{ERROR_MESSAGES.MAP.LOAD_FAILED}</div>; // マップの読み込みに失敗した場合のエラーメッセージを表示
  }

  if (!isLoaded) {
    return <div>Loading...</div>; // マップが読み込まれていない場合のローディングメッセージを表示
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
            .filter((poi) => areaVisibility[poi.area])
            .map((poi) => (
              <Marker
                key={poi.id}
                poi={poi}
                onClick={handleMarkerClick}
                map={map}
                isSelected={selectedMarkerId === poi.id}
              />
            ))}
        {map && currentLocation && (
          <Marker
            key="current-location-marker"
            poi={{
              id: 'current-location',
              name: '現在地',
              location: currentLocation,
              area: 'CURRENT_LOCATION',
              category: '現在地',
            }}
            onClick={() => {}}
            map={map}
            isSelected={false}
          />
        )}
        {selectedPoi && (
          <InfoWindow
            key={selectedPoi.id}
            poi={selectedPoi}
            onCloseClick={handleInfoWindowClose}
          />
        )}
      </GoogleMap>
      <div className="hamburger-menu-container">
        <HamburgerMenu
          pois={pois}
          setSelectedPoi={setSelectedPoi}
          setAreaVisibility={setAreaVisibility}
          localAreaVisibility={localAreaVisibility}
          setLocalAreaVisibility={setLocalAreaVisibility}
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
        />
      </div>
      <button
        onClick={resetNorth}
        style={{
          position: 'absolute',
          top: '15px',
          right: '50px',
          background: 'none',
          border: 'none',
        }}
        title="北向きにリセットします。"
      >
        <img
          src={resetNorthIcon}
          alt="北向きにリセット"
          style={{ width: '50px', height: '50px' }}
        />
      </button>
      <button
        onClick={handleGetCurrentLocation}
        style={{
          position: 'absolute',
          top: '15px',
          right: '110px',
          background: 'none',
          border: 'none',
        }}
        title="現在地を取得します。"
      >
        <img
          src={currentLocationIcon}
          alt="現在地を取得"
          style={{ width: '50px', height: '50px' }}
        />
      </button>
    </div>
  );
};

Map.displayName = 'Map'; // コンポーネントの表示

export { Map };
export default Map;
