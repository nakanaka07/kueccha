// GoogleMapコンポーネントとuseLoadScriptフックを@react-google-maps/apiからインポートします。
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
// Reactのフックとコンポーネントをインポートします。
import React, { useEffect, useState, useCallback, useMemo } from 'react';
// CSSモジュールをインポートします。
import styles from './Map.module.css';
// MapControlsコンポーネントをインポートします。
import { MapControls } from './MapControls';
// MapControlsのCSSモジュールをインポートします。
import './MapControls.module.css';
// MapErrorコンポーネントをインポートします。
import { MapError } from './MapError';
// useMapControlフックをインポートします。
import { useMapControl } from '../../hooks/useMapControl';
// 設定の検証関数と設定オブジェクトをインポートします。
import { validateConfig, CONFIG } from '../../utils/config';
// 定数をインポートします。
import { MAPS_CONFIG, ERROR_MESSAGES, CURRENT_LOCATION_POI } from '../../utils/constants';
// updateRecommend関数をインポートします。
import { updateRecommend } from '../../utils/helpers';
// InfoWindowコンポーネントをインポートします。
import InfoWindow from '../infowindow/InfoWindow';
// LocationWarningコンポーネントをインポートします。
import LocationWarning from '../locationwarning/LocationWarning';
// Markerコンポーネントをインポートします。
import Marker from '../marker/Marker';
// SearchResultsコンポーネントをインポートします。
import SearchResults from '../searchresults/SearchResults';
// 型定義をインポートします。
import type { MapComponentProps, Poi, AreaVisibility } from '../../utils/types';

// APIキーとマップIDが設定されていない場合はエラーをスローします。
if (!MAPS_CONFIG.apiKey || !MAPS_CONFIG.mapId) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

// 設定の検証を試み、失敗した場合はエラーをスローします。
try {
  validateConfig(CONFIG);
} catch (error) {
  console.error('Configuration validation failed:', error);
  throw error;
}

// Mapコンポーネントを定義します。
export const Map: React.FC<MapComponentProps> = ({
  pois, // POIの配列
  selectedPoi, // 選択されたPOI
  setSelectedPoi, // POIを選択する関数
  areaVisibility, // エリアの可視性
  onLoad, // マップがロードされたときのコールバック
  setAreaVisibility, // エリアの可視性を設定する関数
  currentLocation, // 現在の位置
  setCurrentLocation, // 現在の位置を設定する関数
  showWarning, // 警告を表示するかどうか
  setShowWarning, // 警告を表示する関数
  setIsMapLoaded, // マップがロードされたかどうかを設定する関数
}) => {
  // Google Maps APIのスクリプトをロードします。
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey, // APIキー
    mapIds: [MAPS_CONFIG.mapId], // マップID
    libraries: MAPS_CONFIG.libraries, // 使用するライブラリ
    version: MAPS_CONFIG.version, // APIバージョン
    language: MAPS_CONFIG.language, // 言語設定
  });

  // マップのインスタンスを保持する状態変数
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // マップコントロールのフックを使用します。
  const { resetNorth, handleGetCurrentLocation: getCurrentLocation } = useMapControl(map);
  // マップタイプを保持する状態変数
  const [_mapType, _setMapType] = useState<google.maps.MapTypeId | string>('roadmap');
  // 初回レンダリングかどうかを保持する状態変数
  const [isInitialRender, setIsInitialRender] = useState(true);
  // 選択されたマーカーのIDを保持する状態変数
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // マップのロード状態を監視するuseEffectフック
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (loadError) {
      console.error('Map load error:', loadError);
      return;
    }
  }, [isLoaded, loadError]);

  // マップのオプションをメモ化します。
  const mapOptions = useMemo(() => {
    if (!isLoaded) return {};
    return {
      ...MAPS_CONFIG.options,
      mapTypeId: _mapType,
      mapTypeControl: true,
      zoomControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_LEFT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
      },
      ...(MAPS_CONFIG.mapId ? { mapId: MAPS_CONFIG.mapId } : {}),
    };
  }, [isLoaded, _mapType]);

  // マップがロードされたときのコールバック関数
  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      if (mapInstance) {
        setMap(mapInstance);
        setIsMapLoaded(mapInstance);
        onLoad(mapInstance);
      } else {
        console.error('Map instance is null');
      }
    },
    [onLoad, setIsMapLoaded],
  );

  // おすすめエリアの表示を切り替える関数
  const toggleRecommendations = useCallback(() => {
    setAreaVisibility((prev: AreaVisibility) => updateRecommend(prev));
  }, [setAreaVisibility]);

  // マップの境界を更新するuseEffectフック
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

      const allFiltersOff = Object.values(areaVisibility).every((visible) => !visible);
      if (allFiltersOff) {
        map.setCenter(MAPS_CONFIG.defaultCenter);
        map.setZoom(MAPS_CONFIG.defaultZoom);
      } else {
        map.fitBounds(bounds);
        map.panToBounds(bounds);
        if (isInitialRender) {
          setIsInitialRender(false);
        }
      }
    }
  }, [map, pois, areaVisibility, isInitialRender, currentLocation]);

  // マーカーがクリックされたときのコールバック関数
  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
    },
    [setSelectedPoi],
  );

  // InfoWindowが閉じられたときのコールバック関数
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
    setSelectedMarkerId(null);
  }, [setSelectedPoi]);

  // 検索結果がクリックされたときのコールバック関数
  const handleSearchResultClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
      setSelectedMarkerId(poi.id);
      if (map) {
        map.panTo(poi.location);
      }
    },
    [setSelectedPoi, map],
  );

  // 現在地を取得する関数
  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocation({
      onSuccess: (location) => {
        setCurrentLocation(location);
        setAreaVisibility((prev: AreaVisibility) => ({
          ...prev,
          CURRENT_LOCATION: true,
        }));
        setShowWarning(true);
      },
      onError: (error) => alert(error),
    });
  }, [getCurrentLocation, setCurrentLocation, setAreaVisibility, setShowWarning]);

  // ロードエラーが発生した場合のエラーメッセージを表示します。
  if (loadError) {
    return <MapError message={ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={() => window.location.reload()} />;
  }

  // マップがロード中の場合のローディングメッセージを表示します。
  if (!isLoaded) {
    return <div className="loading-container">地図を読み込んでいます...</div>;
  }

  // 表示するPOIをフィルタリングします。
  const displayedPois = pois.filter((poi) => areaVisibility[poi.area]);

  // マップコンポーネントのレンダリング
  return (
    <div role="region" aria-label="地図" className={styles.mapContainer}>
      <GoogleMap
        mapContainerStyle={{
          width: '100%',
          height: '100%',
        }}
        center={MAPS_CONFIG.defaultCenter}
        zoom={MAPS_CONFIG.defaultZoom}
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
        {selectedPoi && <InfoWindow key={selectedPoi.id} poi={selectedPoi} onCloseClick={handleInfoWindowClose} />}
      </GoogleMap>
      <MapControls
        onResetNorth={resetNorth}
        onGetCurrentLocation={handleGetCurrentLocation}
        onToggleRecommendations={toggleRecommendations}
      />
      {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
      <SearchResults results={displayedPois} onResultClick={handleSearchResultClick} />
    </div>
  );
};

// コンポーネントの表示名を設定します。
Map.displayName = 'Map';

// Mapコンポーネントをエクスポートします。
export default Map;
