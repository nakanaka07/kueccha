// Google Maps APIをロードするためのフックとコンポーネントをインポート
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
// Reactのフックをインポート
import React, { useEffect, useState, useCallback, useMemo } from 'react';
// CSSモジュールをインポート
import styles from './Map.module.css';
// MapControlsコンポーネントをインポート
import { MapControls } from './MapControls';
// MapControlsのCSSモジュールをインポート
import './MapControls.module.css';
// MapErrorコンポーネントをインポート
import { MapError } from './MapError';
// カスタムフックをインポート
import { useMapControl } from '../../hooks/useMapControl';
// 設定ファイルとそのバリデーション関数をインポート
import { mapsConfig, validateConfig, CONFIG } from '../../utils/config';
// 定数をインポート
import { ERROR_MESSAGES, CURRENT_LOCATION_POI } from '../../utils/constants';
// InfoWindowコンポーネントをインポート
import InfoWindow from '../infowindow/InfoWindow';
// LocationWarningコンポーネントをインポート
import LocationWarning from '../locationwarning/LocationWarning';
// Markerコンポーネントをインポート
import Marker from '../marker/Marker';
// SearchResultsコンポーネントをインポート
import SearchResults from '../searchresults/SearchResults';
// 型定義をインポート
import type { MapComponentProps, Poi } from '../../utils/types';

// APIキーやマップIDが設定されていない場合にエラーをスロー
if (!mapsConfig.apiKey || !mapsConfig.mapId) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

// 設定のバリデーションを実行し、エラーがあればキャッチしてログに出力
try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('Configuration validation failed:', error);
  throw error;
}

// Mapコンポーネントを定義
export const Map: React.FC<MapComponentProps> = ({
  pois, // POIのリスト
  selectedPoi, // 選択されたPOI
  setSelectedPoi, // POIを選択するための関数
  areaVisibility, // エリアの表示状態
  onLoad, // マップがロードされたときに呼び出される関数
  setAreaVisibility, // エリアの表示状態を設定するための関数
  currentLocation, // 現在地
  setCurrentLocation, // 現在地を設定するための関数
  showWarning, // 警告を表示するかどうかの状態
  setShowWarning, // 警告を表示するかどうかの状態を設定するための関数
}) => {
  // Google Maps APIのスクリプトをロードするフック
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey, // APIキー
    mapIds: [mapsConfig.mapId], // マップID
    libraries: mapsConfig.libraries, // 使用するライブラリ
    version: mapsConfig.version, // APIのバージョン
    language: mapsConfig.language, // 言語設定
  });

  // マップインスタンスを保持する状態変数
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // カスタムフックから関数を取得
  const { resetNorth, handleGetCurrentLocation: getCurrentLocation } =
    useMapControl(map);
  // マップタイプを保持する状態変数
  const [_mapType, _setMapType] = useState<google.maps.MapTypeId | string>(
    'roadmap',
  );
  // 初回レンダリングかどうかを示す状態変数
  const [isInitialRender, setIsInitialRender] = useState(true);
  // 選択されたマーカーのIDを保持する状態変数
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // マップのロード状態を監視するuseEffectフック
  useEffect(() => {
    if (!isLoaded) {
      console.log('Map is loading...');
      return;
    }
    if (loadError) {
      console.error('Map load error:', loadError);
      return;
    }
    console.log('Map loaded successfully');
  }, [isLoaded, loadError]); // isLoadedとloadErrorが変更されるたびに実行

  // マップオプションをメモ化して保持
  const mapOptions = useMemo(() => {
    if (!isLoaded) return {};
    return {
      ...mapsConfig.options,
      mapTypeId: _mapType,
      mapTypeControl: true,
      zoomControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_LEFT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
      },
      ...(mapsConfig.mapId ? { mapId: mapsConfig.mapId } : {}),
    };
  }, [isLoaded, _mapType]); // isLoadedと_mapTypeが変更されるたびに再計算

  // マップがロードされたときに呼び出される関数
  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log('Map instance loaded:', mapInstance);
      if (mapInstance) {
        setMap(mapInstance);
        onLoad(mapInstance);
      } else {
        console.error('Map instance is null');
      }
    },
    [onLoad], // onLoadが変更されるたびに再生成
  );

  // おすすめエリアの表示を切り替える関数
  const toggleRecommendations = useCallback(() => {
    setAreaVisibility((prev) => ({
      ...prev,
      RECOMMEND: !prev.RECOMMEND,
    }));
  }, [setAreaVisibility]); // setAreaVisibilityが変更されるたびに再生成

  // マップの状態を監視し、表示エリアを更新するuseEffectフック
  useEffect(() => {
    if (map) {
      const bounds = new google.maps.LatLngBounds();

      pois.forEach((poi) => {
        if (areaVisibility[poi.area]) {
          bounds.extend(poi.location);
        }
      });

      if (currentLocation) {
        bounds.extend(currentLocation);
      }

      const allFiltersOff = Object.values(areaVisibility).every(
        (visible) => !visible,
      );
      if (allFiltersOff) {
        map.setCenter(mapsConfig.defaultCenter);
        map.setZoom(mapsConfig.defaultZoom);
      } else {
        map.fitBounds(bounds);
        map.panToBounds(bounds);
        if (isInitialRender) {
          setIsInitialRender(false);
        }
      }
    }
  }, [map, pois, areaVisibility, isInitialRender, currentLocation]); // 依存関係が変更されるたびに実行

  // マーカーがクリックされたときに呼び出される関数
  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
    },
    [setSelectedPoi], // setSelectedPoiが変更されるたびに再生成
  );

  // InfoWindowが閉じられたときに呼び出される関数
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
    setSelectedMarkerId(null);
  }, [setSelectedPoi]); // setSelectedPoiが変更されるたびに再生成

  // 検索結果がクリックされたときに呼び出される関数
  const handleSearchResultClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
      if (map) {
        map.panTo(poi.location);
      }
    },
    [setSelectedPoi, map], // setSelectedPoiとmapが変更されるたびに再生成
  );

  // 現在地を取得する関数
  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocation({
      onSuccess: (location) => {
        setCurrentLocation(location);
        setAreaVisibility((prev) => ({
          ...prev,
          CURRENT_LOCATION: true,
        }));
        setShowWarning(true);
      },
      onError: (error) => alert(error),
    });
  }, [
    getCurrentLocation,
    setCurrentLocation,
    setAreaVisibility,
    setShowWarning,
  ]); // 依存関係が変更されるたびに再生成

  // マップのロードエラーが発生した場合の処理
  if (loadError) {
    return (
      <MapError
        message={ERROR_MESSAGES.MAP.LOAD_FAILED}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // マップがロード中の場合の処理
  if (!isLoaded) {
    return <div className="loading-container">地図を読み込んでいます...</div>;
  }

  // 表示するPOIをフィルタリング
  const displayedPois = pois.filter((poi) => areaVisibility[poi.area]);

  return (
    <div role="region" aria-label="地図" className={styles.mapContainer}>
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: '100%',
        }}
        center={mapsConfig.defaultCenter}
        zoom={mapsConfig.defaultZoom}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {map &&
          displayedPois.map((poi) => (
            <Marker
              key={poi.id}
              poi={poi}
              onClick={handleMarkerClick}
              map={map}
              isSelected={selectedMarkerId === poi.id}
              zIndex={selectedMarkerId === poi.id ? 1000 : undefined}
            />
          ))}
        {map && currentLocation && (
          <Marker
            key="current-location-marker"
            poi={{
              ...CURRENT_LOCATION_POI,
              location: currentLocation,
              id: 'current-location',
              name: '現在地',
              area: 'CURRENT_LOCATION',
              category: '現在地',
              genre: '現在地',
            }}
            onClick={() => {}}
            map={map}
            isSelected={false}
            zIndex={1000}
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
      <MapControls
        onResetNorth={resetNorth}
        onGetCurrentLocation={handleGetCurrentLocation}
        onToggleRecommendations={toggleRecommendations}
      />
      {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
      <SearchResults
        results={displayedPois}
        onResultClick={handleSearchResultClick}
      />
    </div>
  );
};

Map.displayName = 'Map';

export default Map;
