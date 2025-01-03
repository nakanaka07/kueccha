import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { CONFIG } from '../../../config';
import type { MapProps, Poi } from '../../../types';
import { Marker } from '../Marker';
import { InfoWindow } from '../InfoWindow';
import { ERROR_MESSAGES } from '../../../constants/messages';

// Mapコンポーネント
const Map = ({ pois }: MapProps) => {
  // Google Mapインスタンスを保持するステート
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // 選択されたPOIを保持するステート
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  // Google Maps APIのスクリプトをロードするフック
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: CONFIG.maps.apiKey,
    mapIds: [CONFIG.maps.mapId],
    libraries: CONFIG.maps.libraries,
  });

  // 現在のマップタイプを保持するステート
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>('roadmap');

  // マップオプションの設定
  const mapOptions = {
    ...CONFIG.maps.options,
    mapTypeId: mapType,
    mapTypeControl: true,
    mapTypeControlOptions: isLoaded
      ? {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
        }
      : undefined,
  };

  // マップタイプが変更されたときのハンドラー
  const handleMapTypeChanged = useCallback(() => {
    if (map) {
      setMapType(map.getMapTypeId() as google.maps.MapTypeId);
    }
  }, [map]);

  // マップがロードされたときのハンドラー
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      map.addListener('maptypeid_changed', handleMapTypeChanged);
    },
    [handleMapTypeChanged],
  );

  // POIの位置に基づいてマップの境界を設定
  useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      pois.forEach((poi) => bounds.extend(poi.location));
      map.fitBounds(bounds);
    }
  }, [map, pois]);

  // マーカーがクリックされたときのハンドラー
  const handleMarkerClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  // マップがクリックされたときのハンドラー
  const handleMapClick = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // InfoWindowが閉じられたときのハンドラー
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // Google Maps APIのロードエラーを処理
  if (loadError) {
    console.error('Maps API loading error:', loadError);
    return (
      <div role="alert">
        <h2>{ERROR_MESSAGES.MAP.LOAD_FAILED}</h2>
        <p>{ERROR_MESSAGES.MAP.RETRY_MESSAGE}</p>
      </div>
    );
  }

  // Google Maps APIがロード中の状態を処理
  if (!isLoaded) {
    return (
      <div role="status">
        <div />
        <span>{ERROR_MESSAGES.LOADING.MAP}</span>
      </div>
    );
  }

  // マップとマーカー、InfoWindowをレンダリング
  return (
    <div role="region" aria-label="地図">
      <GoogleMap
        center={CONFIG.maps.defaultCenter}
        zoom={CONFIG.maps.defaultZoom}
        options={{
          ...mapOptions,
          mapId: CONFIG.maps.mapId, // ここにmapIdを追加
        }}
        onClick={handleMapClick}
        onLoad={onLoad}
      >
        {map &&
          pois.map((poi) => (
            <Marker key={poi.id} poi={poi} onClick={handleMarkerClick} map={map} />
          ))}
        {selectedPoi && <InfoWindow poi={selectedPoi} onCloseClick={handleInfoWindowClose} />}
      </GoogleMap>
    </div>
  );
};

// コンポーネントの表示名を設定
Map.displayName = 'Map';

export { Map };
export default Map;
