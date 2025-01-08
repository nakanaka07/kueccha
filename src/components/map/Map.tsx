import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { mapsConfig } from '../../utils/config';
import type { MapProps, Poi } from '../../utils/types';
import { Marker } from '../marker/Marker';
import { InfoWindow } from '../infowindow/InfoWindow';
import { ERROR_MESSAGES } from '../../utils/constants';
import './Map.css'; // スタイルシートをインポート

interface MapComponentProps extends MapProps {
  selectedPoi: Poi | null;
  setSelectedPoi: (poi: Poi | null) => void;
}

// Mapコンポーネント
const Map = ({ pois, selectedPoi, setSelectedPoi }: MapComponentProps) => {
  // Google Mapインスタンスを保持するステート
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Google Maps APIのスクリプトをロードするフック
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsConfig.apiKey,
    mapIds: [mapsConfig.mapId],
    libraries: mapsConfig.libraries,
  });

  // 現在のマップタイプを保持するステート
  const [mapType, setMapType] = useState<google.maps.MapTypeId | string>('roadmap');

  // マップオプションの設定
  const mapOptions = {
    ...mapsConfig.options,
    mapTypeId: mapType,
    mapTypeControl: true,
    zoomControl: true, // ズームコントロールを有効にする
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
  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      setSelectedPoi(poi);
    },
    [setSelectedPoi],
  );

  // マップがクリックされたときのハンドラー
  const handleMapClick = useCallback(() => {
    setSelectedPoi(null);
  }, [setSelectedPoi]);

  // InfoWindowが閉じられたときのハンドラー
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, [setSelectedPoi]);

  // Google Maps APIのロードエラーを処理
  if (loadError) {
    console.error('Maps API loading error:', loadError);
    return (
      <div role="alert" aria-live="assertive">
        <h2>{ERROR_MESSAGES.MAP.LOAD_FAILED}</h2>
        <p>{ERROR_MESSAGES.MAP.RETRY_MESSAGE}</p>
      </div>
    );
  }

  // Google Maps APIがロード中の状態を処理
  if (!isLoaded) {
    return (
      <div role="status" aria-live="polite">
        <div />
        <span>{ERROR_MESSAGES.LOADING.MAP}</span>
      </div>
    );
  }

  // マップとマーカー、InfoWindowをレンダリング
  return (
    <div role="region" aria-label="地図" className="map-container">
      <GoogleMap
        center={mapsConfig.defaultCenter}
        zoom={mapsConfig.defaultZoom}
        options={{
          ...mapOptions,
          mapId: mapsConfig.mapId,
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
