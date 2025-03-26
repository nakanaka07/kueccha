import InfoWindow from '@components/InfoWindow';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import { getMarkerIcon, isInViewport } from '@utils/markerUtils';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { PointOfInterest } from '@/types/poi';

interface MapMarkersProps {
  /**
   * 表示するPOIデータの配列
   */
  pois: PointOfInterest[];

  /**
   * マップの参照
   */
  mapRef: React.MutableRefObject<google.maps.Map | null>;

  /**
   * フィルタリング条件
   */
  filters?: {
    categories?: string[];
    isOpen?: boolean;
    searchText?: string;
  };

  /**
   * POI選択時のコールバック
   */
  onSelectPOI?: (poi: PointOfInterest) => void;

  /**
   * POI詳細表示時のコールバック
   */
  onViewDetails?: (poi: PointOfInterest) => void;
}

/**
 * 地図上のマーカーを管理するコンポーネント
 * POIデータをもとにマーカーの表示と管理、クラスタリングを行います
 */
const MapMarkers: React.FC<MapMarkersProps> = ({
  pois,
  mapRef,
  filters = {},
  onSelectPOI,
  onViewDetails,
}) => {
  // 選択されたPOI（情報ウィンドウに表示するもの）
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  // マーカーインスタンスの管理
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // マーカークラスタラーの参照
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  // フィルタリングされたPOIリスト
  const filteredPOIs = useMemo(() => {
    if (!pois.length) return [];

    return pois.filter(poi => {
      // カテゴリフィルタリング
      if (filters.categories?.length) {
        if (!poi.categories?.some(category => filters.categories?.includes(category))) {
          return false;
        }
      }

      // 営業中フィルタリング
      if (filters.isOpen) {
        // 閉店している場合は除外
        if (poi.isClosed) return false;

        // 現在の曜日が定休日かチェック
        const now = new Date();
        const day = now.getDay();
        const dayNames = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];
        const currentDayName = dayNames[day];

        // 型安全に動的プロパティにアクセス
        const closedKey = `${currentDayName}定休日` as keyof PointOfInterest;
        if (poi[closedKey] === true) return false;
      }

      // テキストフィルタリング
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();

        // 名称、ジャンル、住所のいずれかにマッチするか
        const nameMatch = poi.name.toLowerCase().includes(searchLower);
        const genreMatch = poi.genre?.toLowerCase().includes(searchLower);
        const addressMatch = poi.address.toLowerCase().includes(searchLower);

        if (!(nameMatch || genreMatch || addressMatch)) {
          return false;
        }
      }

      return true;
    });
  }, [pois, filters]);

  // マーカークリック時のハンドラ
  const handleMarkerClick = useCallback(
    (poi: PointOfInterest) => {
      setSelectedPOI(poi);

      if (onSelectPOI) {
        onSelectPOI(poi);
      }
    },
    [onSelectPOI]
  );

  // 情報ウィンドウを閉じるハンドラ
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPOI(null);
  }, []);

  // POI詳細表示ハンドラ
  const handleViewDetails = useCallback(
    (poi: PointOfInterest) => {
      if (onViewDetails) {
        onViewDetails(poi);
      }
    },
    [onViewDetails]
  );

  // マーカーとクラスタリングの設定
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 既存のマーカーを削除
    markers.forEach(marker => {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });

    // 新しいマーカーを作成
    const newMarkers = filteredPOIs
      .map(poi => {
        try {
          const marker = new google.maps.Marker({
            position: { lat: poi.lat, lng: poi.lng },
            title: poi.name,
            map,
            icon: getMarkerIcon(poi),
            animation: google.maps.Animation.DROP,
            optimized: true, // パフォーマンスのため
          });

          // マーカークリックイベントの設定
          marker.addListener('click', () => {
            handleMarkerClick(poi);
          });

          return marker;
        } catch (error) {
          console.error('マーカー作成エラー:', error);
          return null;
        }
      })
      .filter(Boolean) as google.maps.Marker[];

    setMarkers(newMarkers);

    // クラスタリングの設定
    if (clusterer) {
      clusterer.clearMarkers();
      clusterer.addMarkers(newMarkers);
    } else {
      try {
        const newClusterer = new MarkerClusterer({
          map,
          markers: newMarkers,
          renderer: {
            render: ({ count, position }) => {
              return new google.maps.Marker({
                position,
                label: {
                  text: String(count),
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 'bold',
                },
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4285F4',
                  fillOpacity: 0.9,
                  strokeWeight: 1.5,
                  strokeColor: '#FFFFFF',
                  scale: 18,
                },
                zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
              });
            },
          },
        });

        setClusterer(newClusterer);
      } catch (error) {
        console.error('クラスタリング初期化エラー:', error);
      }
    }

    // クリーンアップ
    return () => {
      newMarkers.forEach(marker => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });

      if (clusterer) {
        clusterer.clearMarkers();
      }
    };
  }, [mapRef, filteredPOIs, handleMarkerClick, markers, clusterer]);

  // マップの表示領域変更時に、表示領域内のマーカーのみ表示する最適化
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateMarkerVisibility = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      markers.forEach((marker, index) => {
        if (index < filteredPOIs.length) {
          const position = marker.getPosition();
          if (position) {
            const isVisible = isInViewport(
              {
                lat: position.lat(),
                lng: position.lng(),
              },
              map
            );
            marker.setVisible(isVisible);
          }
        }
      });
    };

    // 地図の表示領域変更イベントを監視
    const listener = map.addListener('idle', updateMarkerVisibility);

    // 初回実行
    updateMarkerVisibility();

    // クリーンアップ
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [mapRef, markers, filteredPOIs]);

  return (
    <>
      {selectedPOI && (
        <GoogleInfoWindow
          position={{ lat: selectedPOI.lat, lng: selectedPOI.lng }}
          onCloseClick={handleInfoWindowClose}
          options={{
            pixelOffset: new google.maps.Size(0, -40), // マーカーの高さを考慮
            maxWidth: 320, // モバイル画面でも見やすい幅
            disableAutoPan: false, // 情報ウィンドウが見えるように地図を自動調整
          }}
        >
          <div className='info-window-container'>
            <InfoWindow
              poi={selectedPOI}
              onClose={handleInfoWindowClose}
              onViewDetails={handleViewDetails}
            />
          </div>
        </GoogleInfoWindow>
      )}
    </>
  );
};

export default MapMarkers;
