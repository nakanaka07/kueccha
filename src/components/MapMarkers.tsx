import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';

import InfoWindow from '@/components/InfoWindow';
import { useFilteredPOIs } from '@/hooks/useFilteredPOIs';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMarkerVisibility } from '@/hooks/useMarkerVisibility';
import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

// マーカーがAdvancedMarkerElementかどうかを判定する型ガード関数
function isAdvancedMarkerElement(
  marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
): marker is google.maps.marker.AdvancedMarkerElement {
  return 'content' in marker;
}

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

  /**
   * マーカーアニメーションを有効にするか
   * @default false
   */
  animateMarkers?: boolean;

  /**
   * マーカークラスタリングを有効にするか
   * @default false
   */
  enableClustering?: boolean;
}

const COMPONENT_NAME = 'MapMarkers';

/**
 * 地図上のマーカーを管理・表示するコンポーネント
 * - パフォーマンス最適化済み（メモ化と表示範囲に基づく描画最適化）
 * - KISS原則に基づくシンプルな実装
 * - エラーハンドリングを統合
 */
const MapMarkers = memo(
  ({
    pois,
    mapRef,
    filters = {},
    onSelectPOI,
    onViewDetails,
    enableClustering = false,
  }: MapMarkersProps) => {
    // 選択されたPOIの状態
    const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

    // フィルタリングされたPOIを取得
    const filteredPOIs = useFilteredPOIs(pois, filters);

    // useCallbackでメモ化したコールバックを渡す
    const handleMarkerClickForMapMarkers = useCallback(
      (poi: PointOfInterest) => {
        setSelectedPOI(poi);
        if (onSelectPOI) {
          onSelectPOI(poi);
        }
      },
      [onSelectPOI]
    );

    // 可視マーカー数の変化をログに記録するコールバックをメモ化
    const handleVisibilityChange = useCallback((visibleCount: number, totalCount: number) => {
      logger.debug('マーカー表示状態が更新されました', {
        component: COMPONENT_NAME,
        visibleCount,
        totalCount,
        visibilityRatio: totalCount > 0 ? (visibleCount / totalCount) * 100 : 0,
      });
    }, []);

    // マーカーを生成
    const { markers } = useMapMarkers({
      pois: filteredPOIs,
      mapRef,
      enableClustering,
      onMarkerClick: handleMarkerClickForMapMarkers, // メモ化したコールバックを使用
    });

    // マーカー ID 参照マップを作成
    const markerMap = useMemo(() => {
      const map = new Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>();
      markers.forEach((marker, index) => {
        // インデックスが範囲内かつ有効なPOIデータが存在する場合のみ処理
        if (index >= 0 && index < filteredPOIs.length) {
          // 配列インデックスの安全性を確保するために、Array.prototype.atを使用
          const poi = Array.isArray(filteredPOIs) ? filteredPOIs.at(index) : undefined;
          if (poi && poi.id) {
            map.set(poi.id, marker);
          }
        } else {
          logger.warn('無効なマーカーインデックスへのアクセスを防止しました', {
            component: COMPONENT_NAME,
            index,
            arrayLength: filteredPOIs.length,
          });
        }
      });
      return map;
    }, [markers, filteredPOIs]);

    // 表示範囲内のマーカーのみを描画（最適化）
    const { visiblePOIs } = useMarkerVisibility({
      mapRef,
      markers,
      pois: filteredPOIs,
      // モバイルデバイスではパフォーマンス向上のためデバウンス時間を長めに設定
      debounceMs: 300,
      // 表示範囲に余裕を持たせる（佐渡島最適化）
      visibilityMargin: 1.0, // 0.5から1.0に変更して広めに設定
      // メモ化したコールバックを使用
      onVisibilityChange: handleVisibilityChange,
    });

    // 詳細表示処理
    const handleViewDetails = useCallback(
      (poi: PointOfInterest) => {
        if (onViewDetails) {
          onViewDetails(poi);
        }
        setSelectedPOI(null);
      },
      [onViewDetails]
    );

    // 選択済みPOIの詳細表示処理（メモ化）
    const handleSelectedPOIDetails = useCallback(() => {
      if (selectedPOI) {
        handleViewDetails(selectedPOI);
      }
    }, [selectedPOI, handleViewDetails]);

    // 情報ウィンドウを閉じる処理
    const handleInfoWindowClose = useCallback(() => {
      setSelectedPOI(null);
    }, []);

    // マーカークリックイベントのリスナー設定
    useEffect(() => {
      // リスナー配列を初期化
      const listeners: google.maps.MapsEventListener[] = [];

      // パフォーマンスを考慮し、表示される可能性のあるマーカーのみにリスナーを追加
      visiblePOIs.forEach(poi => {
        const marker = markerMap.get(poi.id);
        if (!marker) return;

        // マーカーの種類によってイベントリスナーを適切に追加
        if (isAdvancedMarkerElement(marker)) {
          // AdvancedMarkerElement用のイベント設定
          const clickListener = marker.addListener('click', () =>
            handleMarkerClickForMapMarkers(poi)
          );
          listeners.push(clickListener);
        } else {
          // 通常Marker用のイベント設定
          const clickListener = marker.addListener('click', () =>
            handleMarkerClickForMapMarkers(poi)
          );
          listeners.push(clickListener);
        }
      });

      // クリーンアップ関数
      return () => {
        listeners.forEach(listener => {
          google.maps.event.removeListener(listener);
        });
      };
    }, [visiblePOIs, markerMap, handleMarkerClickForMapMarkers]);

    // 情報ウィンドウ用のコンテンツをメモ化
    const infoWindowContent = useMemo(() => {
      if (!selectedPOI) return null;

      return (
        <InfoWindow
          poi={selectedPOI}
          onClose={handleInfoWindowClose}
          onViewDetails={handleSelectedPOIDetails}
        />
      );
    }, [selectedPOI, handleInfoWindowClose, handleSelectedPOIDetails]);

    // 情報ウィンドウが表示されていて内容が存在する場合のみレンダリング

    // 情報ウィンドウの設定をメモ化
    const infoWindowOptions = useMemo(
      () => ({
        maxWidth: 320,
        pixelOffset: new google.maps.Size(0, -30),
      }),
      []
    );

    // 選択されたPOIの位置情報をメモ化
    const selectedPOIPosition = useMemo(() => {
      if (!selectedPOI) return null;
      return {
        lat: selectedPOI.latitude,
        lng: selectedPOI.longitude,
      };
    }, [selectedPOI]);

    return (
      <>
        {selectedPOI && infoWindowContent && selectedPOIPosition && (
          <GoogleInfoWindow
            position={selectedPOIPosition}
            onCloseClick={handleInfoWindowClose}
            options={infoWindowOptions}
          >
            <div className='info-window-container'>{infoWindowContent}</div>
          </GoogleInfoWindow>
        )}
      </>
    );
  }
);

// デバッグのための表示名を設定
MapMarkers.displayName = COMPONENT_NAME;

export default MapMarkers;
