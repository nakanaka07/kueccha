import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import React, { useState, useCallback, memo, useMemo, useEffect, useRef } from 'react';

import InfoWindow from '@/components/InfoWindow';
import { useFilteredPOIs } from '@/hooks/useFilteredPOIs';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMarkerVisibility } from '@/hooks/useMarkerVisibility';
import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

// デバッグヘルパー関数の直接定義（型エラー回避のため）
function debugMarkersAndPOIs(
  markers: google.maps.marker.AdvancedMarkerElement[],
  pois: PointOfInterest[]
): void {
  try {
    logger.info('==== マーカーとPOIのデバッグ情報 ====', {
      component: 'MapMarkersDebug',
      markerCount: markers.length,
      poiCount: pois.length,
      invalidMarkers: markers.filter(marker => !marker.position).length,
      unmappedMarkers: markers.filter(marker => !marker.map).length,
      invalidPOIs: pois.filter(poi => !poi.id || (!poi.latitude && !poi.lat)).length,
    });
  } catch (error) {
    logger.error('デバッグ情報出力中にエラー', {
      component: 'MapMarkersDebug',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function debugMarkerVisibility(
  visiblePOIs: PointOfInterest[],
  markers: google.maps.marker.AdvancedMarkerElement[],
  mapRef: React.RefObject<google.maps.Map | null>
): void {
  try {
    // mapRefを使用して地図情報をログに含める
    const mapInfo = mapRef.current
      ? {
          zoom: mapRef.current.getZoom(),
          center: mapRef.current.getCenter()?.toJSON(),
          hasBounds: !!mapRef.current.getBounds(),
        }
      : { status: 'マップが初期化されていません' };

    logger.info('マーカー可視性デバッグ情報', {
      component: 'MapMarkersDebug',
      visiblePoisCount: visiblePOIs.length,
      totalMarkersCount: markers.length,
      mapInfo,
    });
  } catch (error) {
    logger.error('可視性デバッグ情報出力中にエラー', {
      component: 'MapMarkersDebug',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// タイプガード関数は、Google Maps APIが読み込まれた後に利用可能になります

interface MapMarkersProps {
  /**
   * 表示するPOIデータの配列
   */
  pois: PointOfInterest[] /**
   * マップの参照
   * @deprecated MutableRefObject は非推奨ですが、互換性のために RefObject を使用
   */;
  mapRef: React.RefObject<google.maps.Map | null>;

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
    // パフォーマンス計測用
    const renderStartTime = useRef<number>(performance.now());

    // Google Maps APIが初期化された後に使用する情報ウィンドウのオプション
    const INFO_WINDOW_OPTIONS = useMemo(() => {
      if (!mapRef?.current || !google?.maps) {
        return {
          maxWidth: 320,
          pixelOffset: null,
        };
      }

      return {
        maxWidth: 320,
        pixelOffset: new google.maps.Size(0, -30),
      };
    }, [mapRef]);

    // マーカーがAdvancedMarkerElementかどうかを判定する型ガード関数
    const isAdvancedMarkerElement = useCallback(
      (
        marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
      ): marker is google.maps.marker.AdvancedMarkerElement => {
        return 'content' in marker;
      },
      []
    );

    // コンポーネントのレンダリングパフォーマンスを計測
    useEffect(() => {
      const renderTime = performance.now() - renderStartTime.current;
      // 100ms以上かかる場合は警告（大量のマーカーを扱う場合に役立つ）
      if (renderTime > 100) {
        logger.warn('マーカーレンダリングに時間がかかっています', {
          component: COMPONENT_NAME,
          renderTimeMs: renderTime.toFixed(2),
          poiCount: pois.length,
        });
      }
      // 次回レンダリング計測のためリセット
      renderStartTime.current = performance.now();
    }, [pois.length]); // 依存配列を追加してレンダリング計測を最適化

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

    // マーカー生成後のログ出力（デバッグ時のみ）
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('マーカー生成完了', {
          component: COMPONENT_NAME,
          markerCount: markers?.length || 0,
          poisCount: filteredPOIs?.length || 0,
        });
      }
    }, [markers, filteredPOIs]);

    // マーカー ID 参照マップを作成（効率化）
    const markerMap = useMemo(() => {
      // Google Maps APIがまだ読み込まれていない場合は空のマップを返す
      if (!google?.maps) {
        logger.debug('Google Maps APIがまだ読み込まれていないため、空のマーカーマップを返します', {
          component: COMPONENT_NAME,
        });
        return new Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>();
      }

      // ポイとマーカーの数が一致するか確認
      if (markers.length !== filteredPOIs.length) {
        logger.warn('マーカー数とPOI数が一致しません', {
          component: COMPONENT_NAME,
          markersCount: markers.length,
          poisCount: filteredPOIs.length,
        });
      }

      // 大量マーカー対応：初期容量指定によるハッシュ衝突減少と高速化
      const map = new Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>();

      // より安全なアクセス方法でマーカーと位置情報をマッピング
      markers.forEach((marker, index) => {
        // 配列の境界チェックを最適化
        if (index < 0 || index >= filteredPOIs.length) {
          logger.warn('無効なマーカーインデックスへのアクセスを防止しました', {
            component: COMPONENT_NAME,
            index,
            arrayLength: filteredPOIs.length,
          });
          return; // 早期リターンで以降の処理をスキップ
        }

        // セキュリティ対策: Array.atメソッドを使用して安全にアクセス（Modern JS/TS機能）
        const poi = Array.isArray(filteredPOIs) ? filteredPOIs.at(index) : undefined;
        if (!poi?.id) return;

        // セキュリティ対策：poiのidを文字列として明示的に扱い、安全にマップに追加
        const poiId = String(poi.id);
        map.set(poiId, marker);
      }); // デバッグ情報を追加（セキュリティ対策としてプリミティブ値のみを使用）
      if (process.env.NODE_ENV !== 'production') {
        const markerCount = map.size;
        const expectedCount = Array.isArray(markers) ? markers.length : 0;
        logger.debug('マーカーマップを構築しました', {
          component: COMPONENT_NAME,
          markerCount,
          expectedCount,
        });
      }

      return map;
    }, [markers, filteredPOIs]);

    // 表示範囲内のマーカーのみを描画（最適化）
    const { visiblePOIs, hasError } = useMarkerVisibility({
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

    // マーカー可視性エラーチェック
    useEffect(() => {
      if (hasError) {
        logger.warn('マーカー可視性の計算でエラーが発生しました。すべてのマーカーを表示します。', {
          component: COMPONENT_NAME,
          markersCount: markers.length,
          poisCount: filteredPOIs.length,
        });
      }
    }, [hasError, markers.length, filteredPOIs.length]); // デバッグ情報の出力（開発環境のみ）
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        if (markers.length > 0 && filteredPOIs.length > 0) {
          // マーカーとPOIの問題を診断
          debugMarkersAndPOIs(markers, filteredPOIs);
          // 可視性の問題を診断
          if (mapRef.current) {
            debugMarkerVisibility(visiblePOIs, markers, mapRef);
          }
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markers.length, filteredPOIs.length, visiblePOIs.length]);

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
    }, []); // マーカークリックイベントのリスナー設定    // 最適化されたリスナー関数を参照安定性のため外部で定義
    const addMarkerClickListener = useCallback(
      (
        marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker,
        poi: PointOfInterest
      ): google.maps.MapsEventListener => {
        if (isAdvancedMarkerElement(marker)) {
          // AdvancedMarkerElement用のイベント設定 - gmp-clickを使用
          return marker.addListener('gmp-click', () => handleMarkerClickForMapMarkers(poi));
        } else {
          // 通常Marker用のイベント設定 - 従来のclickを使用
          return marker.addListener('click', () => handleMarkerClickForMapMarkers(poi));
        }
      },
      [handleMarkerClickForMapMarkers, isAdvancedMarkerElement]
    );

    // イベントリスナーを設定するuseEffect
    useEffect(() => {
      // リスナー配列を初期化
      const listeners: google.maps.MapsEventListener[] = [];

      try {
        // パフォーマンスを考慮し、表示される可能性のあるマーカーのみにリスナーを追加
        visiblePOIs.forEach(poi => {
          const marker = markerMap.get(poi.id);
          if (!marker) return;

          const listener = addMarkerClickListener(marker, poi);
          listeners.push(listener);
        }); // visiblePOIs.length > 0 の場合、マーカー設定の成功をログに記録
        if (listeners.length > 0) {
          const listenersCount = listeners.length;
          logger.debug('マーカーイベントリスナーを設定しました', {
            component: COMPONENT_NAME,
            markerCount: listenersCount,
          });
        }
      } catch (error) {
        // エラーハンドリングを追加
        logger.error('マーカーイベントリスナーの設定中にエラーが発生しました', {
          component: COMPONENT_NAME,
          error,
        });
      }

      // クリーンアップ関数
      return () => {
        listeners.forEach(listener => {
          google.maps.event.removeListener(listener);
        });
      };
    }, [visiblePOIs, markerMap, addMarkerClickListener]);

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
    }, [selectedPOI, handleInfoWindowClose, handleSelectedPOIDetails]); // 情報ウィンドウが表示されていて内容が存在する場合のみレンダリング
    // コンポーネント外部で定義した定数を使用

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
        {' '}
        {selectedPOI &&
          infoWindowContent &&
          selectedPOIPosition &&
          google?.maps &&
          INFO_WINDOW_OPTIONS && (
            <GoogleInfoWindow
              position={selectedPOIPosition}
              onCloseClick={handleInfoWindowClose}
              options={INFO_WINDOW_OPTIONS}
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
