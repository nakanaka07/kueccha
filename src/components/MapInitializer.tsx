import { useCallback, useEffect, useState, useMemo, memo } from 'react';

import { MapLoadingError } from '@/components/MapLoadingError';
import { getEnvVar } from '@/env';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { logger } from '@/utils/logger';

// 静的ホスティング環境であるかの判断
const isStaticHosting = (): boolean => {
  // 環境変数で明示的に指定されているか、ドメインでチェック
  const staticHostingEnv =
    getEnvVar({ key: 'VITE_STATIC_HOSTING', defaultValue: 'false' }) === 'true';
  // よく使われる静的ホスティングのドメインをチェック
  const staticDomains = ['github.io', 'netlify.app', 'vercel.app', 'pages.dev'];
  const isStaticDomain = staticDomains.some(domain => window.location.hostname.includes(domain));

  return staticHostingEnv || isStaticDomain;
};

// 静的ホスティング向けのマップタイムアウト設定
const STATIC_HOSTING_TIMEOUT = 8000; // より短く設定して素早いフォールバック
const DEFAULT_TIMEOUT = 15000;
// リトライ間隔と最大回数
const RETRY_DELAY = 3000;

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

      // RETRY_DELAYミリ秒後にDOM要素の存在を確認
      setTimeout(() => {
        if (document.getElementById('map')) {
          setIsMapElementReady(true);
          logger.debug('再試行: マップDOM要素が準備完了', { retryAttempt: retryCount + 1 });
        } else {
          logger.warn('再試行: マップDOM要素が見つかりません', { retryAttempt: retryCount + 1 });
        }
      }, RETRY_DELAY);
    }, [retryCount]);

    // マップを読み込むべきかの判定
    const shouldLoadMap = isMapElementReady && environmentError === null;

    // マップ初期化オプションをメモ化（静的ホスティング向けの最適化を含む）
    const isStatic = isStaticHosting(); // 関数呼び出し結果を変数に保存
    const initOptions = useMemo(
      () => ({
        zoom: 11,
        center: sadoBounds.center,
        // 静的ホスティング向けのUI最適化オプション
        disableDefaultUI: isStatic,
        gestureHandling: 'greedy', // モバイルでのピンチズームを改善
        fullscreenControl: true, // フルスクリーンは常に利用可能に
        maxZoom: 18, // 最大ズームレベルを制限してタイル読み込みを最適化
        minZoom: 9, // 最小ズームレベルを設定
        // マウスホイールズームを少し遅くして操作性向上
        scrollwheel: true,
        zoomControl: !isStatic, // 静的ホスティング時はUIを最小限に
      }),
      [sadoBounds, isStatic]
    );

    // Google Maps API読み込み（キャッシュ使用設定を追加）
    const { error: mapLoadError } = useGoogleMaps(shouldLoadMap ? '#map' : null, {
      initOptions,
      timeout: isStatic ? STATIC_HOSTING_TIMEOUT : DEFAULT_TIMEOUT,
      onLoad: handleMapLoad,
      // オプションで自動初期化を制御（現状はデフォルトtrueのまま）
      autoInit: true,
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
