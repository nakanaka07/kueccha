/*
 * 機能:
 *   - アプリケーションのメインコンポーネント
 *   - POI（Points of Interest）データの統合と管理
 *   - マップ表示と位置情報機能の統合
 *   - 現在地情報の取得と関連警告の表示
 *   - エラーハンドリングとロード状態の管理
 *
 * 依存関係:
 *   - React v16.8以上（Hooksを使用）
 *   - カスタムフック: useAppState, useLocationWarning, useSheetData, useMapNorthControl, useCurrentLocationPoi
 *   - 定数: LOADING_MESSAGES
 *   - コンポーネント: AppLayout
 *   - 地図ライブラリ（mapInstanceを通じてアクセス）
 *
 * 注意点:
 *   - 位置情報機能の許可が必要です
 *   - マップとデータの読み込み状態に応じた表示制御があります
 *   - エラー発生時は統合されたエラーメッセージが表示されます
 *   - 現在地POIと外部POIデータを統合して表示します
 */
import React, { useCallback, useMemo, useEffect } from 'react';
import { LOADING_MESSAGES, ERRORS } from '../core/constants/messages';
import { useAppState } from '../core/hooks/useAppState';
import { useLocationWarning } from '../core/hooks/useLocationWarning';
import { useSheetData } from '../core/services/sheets';
import { useMapNorthControl } from '../modules/map/hooks/useMapNorthControl';
import { useCurrentLocationPoi } from '../modules/poi/hooks/useCurrentLocationPoi';
import { AppLayout as AppLayoutOriginal } from '../shared/components/layout/AppLayout';
import { ErrorBoundary } from '../shared/components/ui/error/ErrorBoundary';
import type { MapInstance, MapActions } from '../core/types/map';
import type { Poi } from '../core/types/poi';

// AppErrorインターフェースの拡張
interface AppError {
  message: string;
  code?: string;
  severity?: 'warning' | 'error' | 'critical';
  details?: unknown;
}

// 型の強化
interface AppState {
  mapInstance: MapInstance | null;
  isMapLoaded: boolean;
  isMapLoading: boolean;
  loading: {
    isVisible: boolean;
    isFading: boolean;
  };
  error: AppError | null;
  actions: MapActions;
  selectedPoi: Poi | null;
}

// AppLayout用のprops型定義
interface AppLayoutProps {
  loadingState: {
    isMapLoaded: boolean;
    isLoadingVisible: boolean;
    isFading: boolean;
    loadingMessage: string;
  };
  errorState: {
    hasError: boolean;
    errorMessage?: string;
  };
  warningState: {
    showWarning: boolean;
    setShowWarning: (show: boolean) => void;
  };
  poiData: {
    allPois: Poi[];
    selectedPoi: Poi | null;
  };
  mapActions: MapActions & {
    resetNorth: () => void;
    handleGetCurrentLocation: () => void;
  };
}

// 重いコンポーネントにメモ化を追加
const AppLayout = React.memo(AppLayoutOriginal as React.FC<AppLayoutProps>);

const App: React.FC = () => {
  // データ取得ロジックの分離
  const { data: pois, error: poisError } = useSheetData();
  const { currentLocation, showWarning, setShowWarning, getCurrentLocationInfo } = useLocationWarning();

  const currentLocationPoi = useCurrentLocationPoi(currentLocation);

  // POIデータ処理の最適化
  const allPois = useMemo(() => {
    if (!pois?.length) return currentLocationPoi ? [currentLocationPoi] : [];
    return currentLocationPoi ? [currentLocationPoi, ...pois] : pois;
  }, [pois, currentLocationPoi]);

  const {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading: { isVisible: isLoadingVisible, isFading },
    error: mapError,
    actions,
    selectedPoi,
  }: AppState = useAppState(allPois);

  const { onResetNorth: resetNorth } = useMapNorthControl(mapInstance);

  // エラー処理の効率化
  const errorDetails = useMemo(() => {
    const error = mapError || poisError;
    if (!error) return null;

    return {
      message: error.message || ERRORS.systemError,
      severity: error.severity || 'error',
      code: error.code,
    };
  }, [mapError, poisError]);

  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  const loadingMessage = useMemo(() => (isMapLoading ? LOADING_MESSAGES.map : LOADING_MESSAGES.data), [isMapLoading]);

  // マップインスタンスの適切な管理
  useEffect(() => {
    if (!mapInstance) return;

    // マップインスタンスのセットアップコード
    const setupMap = () => {
      // ここに必要な初期設定を実装
    };

    setupMap();

    return () => {
      // マップインスタンスのクリーンアップ
      if (mapInstance?.cleanup && typeof mapInstance.cleanup === 'function') {
        mapInstance.cleanup();
      }
    };
  }, [mapInstance]);

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>読み込み中...</div>}>
        <AppLayout
          // ステータス関連
          loadingState={{
            isMapLoaded,
            isLoadingVisible,
            isFading,
            loadingMessage,
          }}
          // エラー関連
          errorState={{
            hasError: !!errorDetails,
            errorMessage: errorDetails?.message,
          }}
          // 警告関連
          warningState={{
            showWarning,
            setShowWarning,
          }}
          // POI関連
          poiData={{
            allPois,
            selectedPoi,
          }}
          // アクション関連
          mapActions={{
            ...actions,
            resetNorth,
            handleGetCurrentLocation,
          }}
        />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
