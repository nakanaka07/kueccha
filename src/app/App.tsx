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
import React, { useCallback, useMemo } from 'react';
import { LOADING_MESSAGES } from '../core/constants/messages';
import { useAppState } from '../core/hooks/useAppState';
import { useLocationWarning } from '../core/hooks/useLocationWarning';
import { useSheetData } from '../core/services/sheets';
import { useMapNorthControl } from '../modules/map/hooks/useMapNorthControl';
import { useCurrentLocationPoi } from '../modules/poi/hooks/useCurrentLocationPoi';
import { AppLayout } from '../shared/components/layout/AppLayout';

interface AppError {
  message: string;
  code?: string;
}

const App: React.FC = () => {
  const { data: pois, error: poisError } = useSheetData();
  const { currentLocation, showWarning, setShowWarning, getCurrentLocationInfo } = useLocationWarning();
  const currentLocationPoi = useCurrentLocationPoi(currentLocation);

  const allPois = useMemo(() => {
    if (!pois) return currentLocationPoi ? [currentLocationPoi] : [];
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
  } = useAppState(allPois);

  const { onResetNorth: resetNorth } = useMapNorthControl(mapInstance);

  const combinedError = mapError || poisError;
  const errorMessage = combinedError?.message || '予期しないエラーが発生しました';

  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  const loadingMessage = useMemo(() => (isMapLoading ? LOADING_MESSAGES.map : LOADING_MESSAGES.data), [isMapLoading]);

  return (
    <AppLayout
      isMapLoaded={isMapLoaded}
      isLoadingVisible={isLoadingVisible}
      isFading={isFading}
      combinedError={!!combinedError}
      errorMessage={errorMessage}
      loadingMessage={loadingMessage}
      showWarning={showWarning}
      allPois={allPois}
      selectedPoi={selectedPoi}
      actions={actions}
      resetNorth={resetNorth}
      handleGetCurrentLocation={handleGetCurrentLocation}
      setShowWarning={setShowWarning}
    />
  );
};

export default App;
