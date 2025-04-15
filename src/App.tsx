import { useCallback, useState, useEffect, useRef, useMemo } from 'react';

import { validateEnv } from '../config/env-validator';

import ErrorDisplay from '@/components/ErrorDisplay';
import { MapLoadingError } from '@/components/MapLoadingError';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { usePOIData } from '@/hooks/usePOIData';
// usePOIStateは現時点では不要なため削除（YAGNI原則）
import { getEnvVar } from '@/utils/env/core';
import { toLogLevel } from '@/utils/env/transforms';
import { logger } from '@/utils/logger';

/**
 * メインアプリケーションコンポーネント
 * 地図の表示とPOIデータの管理を行います
 */
function App() {
  // --- 状態管理 ---
  const [envError, setEnvError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isMapElementReady, setIsMapElementReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // --- 副作用 ---

  // 1. 環境変数検証 (初回のみ)
  useEffect(() => {
    logger.info('アプリケーション初期化開始');
    try {
      logger.info('環境変数検証を開始');
      validateEnv(import.meta.env);
      logger.info('環境変数検証 完了');
    } catch (error) {
      const errorMsg = '環境変数の検証中にエラーが発生しました';
      logger.error(errorMsg, { error });
      setEnvError(errorMsg);
    }
  }, []);

  // 2. ロガー設定 (初回のみ)
  useEffect(() => {
    const logLevelStr = getEnvVar({
      key: 'VITE_LOG_LEVEL',
      defaultValue: import.meta.env.DEV ? 'debug' : 'info',
    });
    const logLevel = toLogLevel(logLevelStr);
    logger.configure({ minLevel: logLevel });
    logger.info('ロガー設定を環境に合わせて調整しました', { logLevel });
  }, []);

  // 3. POIデータ取得 (環境変数エラーがない場合)
  const { error: poisError } = usePOIData({ enabled: envError === null });

  // 4. POI状態管理は現時点では必要ないためコメントアウト（YAGNI原則）
  // 将来必要になった時点で有効化する
  // const { selectedPOI, filteredPOIs } = usePOIState(pois);

  // 5. マップ要素準備完了ハンドラ (useEffect内で直接セット)
  useEffect(() => {
    if (document.getElementById('map')) {
      logger.debug('マップDOM要素が準備完了');
      setIsMapElementReady(true);
    }
    // TODO: Consider MutationObserver if map div might appear later
  }, []); // Check only once on mount

  // 6. Google Maps API 読み込み完了コールバック (トップレベル)
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    logger.info('Google Maps APIの読み込みが完了しました');
    mapRef.current = map;
  }, []); // 依存配列は空

  // 7. Google Maps API 読み込み (フックは常に呼び出す)
  const shouldLoadMap = isMapElementReady && envError === null;
  const { error: mapLoadError } = useGoogleMaps(
    shouldLoadMap ? '#map' : null, // 条件に応じて mapId を null にする
    {
      initOptions: {
        zoom: 11,
        center: { lat: 38.0413, lng: 138.3689 },
      },
      timeout: 15000,
      onLoad: handleMapLoad, // トップレベルで定義したコールバックを使用
    }
  );

  // --- コールバック ---

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

  // --- メモ化された計算 ---  // 表示すべきエラーの決定
  const displayError = useMemo(() => {
    if (envError) return envError;
    // mapLoadError は useGoogleMaps から直接取得したものを使用
    // (shouldLoadMap が false の場合、フックが null またはエラーでない値を返すことを期待)
    if (mapLoadError) return '地図の読み込みに失敗しました: ' + mapLoadError;
    if (poisError) return 'スポット情報の読み込みに失敗しました: ' + poisError;
    return null;
  }, [envError, mapLoadError, poisError]);

  // エラーコンポーネントの選択
  const errorComponent = useMemo(() => {
    if (!displayError) return null;
    // 地図読み込みエラーの場合
    if (mapLoadError) {
      // mapLoadError を直接使用
      return <MapLoadingError error={displayError} onRetry={handleRetryMapLoad} />;
    }
    // その他のエラー
    return <ErrorDisplay message={displayError} />;
  }, [displayError, mapLoadError, handleRetryMapLoad]); // mapLoadError を依存配列に追加

  // --- レンダリング ---
  return (
    <div className='app-container'>
      {/* エラー表示 */}
      {errorComponent}

      {/* アプリケーションコンテンツ */}
      <div id='map' className='map-container' />
    </div>
  );
}

export default App;

// 削除されたカスタムフックと関数:
// - useEnvValidation
// - useLoggerConfiguration
// - useMapRetry
// - useMapState
// - usePOIManagement
// - useMapManagement
// - useUIState
// - errorToString
// - calculateDisplayError
// - selectErrorComponent
// - useAppConfiguration (呼び出し箇所を削除)
