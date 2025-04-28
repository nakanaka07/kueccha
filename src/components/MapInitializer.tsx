import { useCallback, useEffect, useState, useMemo, memo } from 'react';

import { MapLoadingError } from '@/components/MapLoadingError';
import { getEnvVar } from '@/env';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { logger } from '@/utils/logger';

// 静的ホスティング環境であるかの判断
const isStaticHosting = (): boolean => {
  return (
    getEnvVar({ key: 'VITE_STATIC_HOSTING', defaultValue: 'false' }) === 'true' ||
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('netlify.app')
  );
};

// 静的ホスティング向けのマップタイムアウト設定（より短く）
const STATIC_HOSTING_TIMEOUT = 10000;
const DEFAULT_TIMEOUT = 15000;

interface MapInitializerProps {
  onMapLoad: (map: google.maps.Map) => void;
  environmentError: string | null;
}

/**
 * Google Maps初期化に特化したコンポーネント
 *
 * マップの読み込み、エラーハンドリング、再試行ロジックを担当
 * メモ化により不要な再レンダリングを防止
 */
export const MapInitializer: React.FC<MapInitializerProps> = memo(
  ({ onMapLoad, environmentError }) => {
    // マップ関連の状態
    const [isMapElementReady, setIsMapElementReady] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // マップ要素が準備できているかチェック
    useEffect(() => {
      if (document.getElementById('map')) {
        logger.debug('マップDOM要素が準備完了');
        setIsMapElementReady(true);
      }
    }, []); // マウント時のみ実行

    // 佐渡島の境界設定をmemo化してオブジェクト生成を最適化
    const sadoBounds = useMemo(() => {
      // GoogleのAPIが初期化される前はセンターのみ返す
      if (!window.google?.maps) {
        return {
          bounds: null,
          center: { lat: 38.0413, lng: 138.3689 },
        };
      }

      // APIが利用可能な場合はLatLngBoundsを作成
      return {
        bounds: new google.maps.LatLngBounds(
          { lat: 37.8, lng: 138.1 }, // 南西
          { lat: 38.4, lng: 138.6 } // 北東
        ),
        center: { lat: 38.0413, lng: 138.3689 },
      };
    }, []); // Google Maps読み込み完了時のコールバック
    const handleMapLoad = useCallback(
      (map: google.maps.Map) => {
        logger.info('Google Maps APIの読み込みが完了しました');

        // 佐渡島の境界を設定して地図を調整（boundsが存在する場合のみ）
        if (sadoBounds.bounds) {
          map.fitBounds(sadoBounds.bounds);
        } else {
          // boundsがない場合は中心点とズームレベルを設定
          map.setCenter(sadoBounds.center);
          map.setZoom(11);
        }

        // 親コンポーネントにマップインスタンスを渡す
        onMapLoad(map);
      },
      [onMapLoad, sadoBounds]
    );

    // 地図読み込み再試行ハンドラ
    const handleRetryMapLoad = useCallback(() => {
      logger.info('地図読み込みの再試行を実行', { retryCount: retryCount + 1 });
      setRetryCount(prev => prev + 1);

      // マップ要素の準備状態をリセットし、再チェックをトリガー
      setIsMapElementReady(false);

      // 少し遅延させてDOMの準備を確認
      setTimeout(() => {
        if (document.getElementById('map')) {
          setIsMapElementReady(true);
        }
      }, 0);
    }, [retryCount]);

    // マップを読み込むべきかの判定
    const shouldLoadMap = isMapElementReady && environmentError === null;

    // マップ初期化オプションをメモ化
    const initOptions = useMemo(
      () => ({
        zoom: 11,
        center: sadoBounds.center,
      }),
      [sadoBounds]
    );

    // Google Maps API読み込み
    const { error: mapLoadError } = useGoogleMaps(shouldLoadMap ? '#map' : null, {
      initOptions,
      timeout: isStaticHosting() ? STATIC_HOSTING_TIMEOUT : DEFAULT_TIMEOUT,
      onLoad: handleMapLoad,
    });

    // エラーがあれば表示
    if (mapLoadError) {
      return (
        <MapLoadingError
          error={`地図の読み込みに失敗しました: ${mapLoadError}`}
          onRetry={handleRetryMapLoad}
        />
      );
    }

    return null; // エラーがなければ何も表示しない
  }
);

export default MapInitializer;
