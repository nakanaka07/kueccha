/**
 * 機能: アプリケーション全体のコンテキストを統合管理するReactコンテキスト
 * 依存関係:
 *   - React (createContext, useContext, useEffect)
 *   - 他のコンテキストプロバイダー (GeolocationProvider, LoadingProvider, MapProvider, PoiProvider)
 *   - useAreaVisibility フック (エリア表示制御)
 *   - Poi 型定義
 * 注意点:
 *   - すべての下位コンテキストを統合し、単一のアクセスポイント(useAppContext)を提供
 *   - コンテキスト間の連携を自動的に処理（位置情報取得時のマップ中心更新など）
 *   - コンポーネントのローディング状態を集中管理
 *   - エリアフィルターの変更に応じてPOIを自動的にフィルタリング
 *   - 必ずAppProvider内で使用する必要がある
 */
import React, { createContext, useContext } from 'react';
import { GeolocationProvider, useGeolocationContext } from './GeolocationContext';
import { LoadingProvider, useLoadingContext } from './LoadingContext';
import { MapProvider, useMapContext } from './MapContext';
import { PoiProvider, usePoiContext } from './PoiContext';
import { useAreaVisibility } from '../../modules/filter/hooks/useAreaVisibility';
import type { Poi } from '../../types/common';

// コンテキストの型定義
interface AppContextType {
  map: ReturnType<typeof useMapContext>;
  poi: ReturnType<typeof usePoiContext>;
  geolocation: ReturnType<typeof useGeolocationContext>;
  loading: ReturnType<typeof useLoadingContext>;
  areaVisibility: ReturnType<typeof useAreaVisibility>;
}

// コンテキストの作成
export const AppContext = createContext<AppContextType | null>(null);

// コンテキストプロバイダーコンポーネント
export const AppProvider: React.FC<{
  children: React.ReactNode;
  initialPois: Poi[];
}> = ({ children, initialPois }) => {
  const { areaVisibility, setAreaVisibility } = useAreaVisibility();

  return (
    <LoadingProvider>
      <GeolocationProvider>
        <MapProvider>
          <PoiProvider initialPois={initialPois}>
            <AppContextConsumer areaVisibility={{ areaVisibility, setAreaVisibility }}>{children}</AppContextConsumer>
          </PoiProvider>
        </MapProvider>
      </GeolocationProvider>
    </LoadingProvider>
  );
};

// 内部コンポーネントでコンテキストを統合
const AppContextConsumer: React.FC<{
  children: React.ReactNode;
  areaVisibility: ReturnType<typeof useAreaVisibility>;
}> = ({ children, areaVisibility }) => {
  const map = useMapContext();
  const poi = usePoiContext();
  const geolocation = useGeolocationContext();
  const loading = useLoadingContext();

  // ローディング状態の登録
  React.useEffect(() => {
    loading.registerLoading('map', map.state.isLoading);
    loading.registerLoaded('map', map.state.isMapLoaded);
  }, [map.state.isLoading, map.state.isMapLoaded, loading]);

  React.useEffect(() => {
    loading.registerLoading('poi', poi.state.isLoading);
    loading.registerLoaded('poi', poi.state.isLoaded);
  }, [poi.state.isLoading, poi.state.isLoaded, loading]);

  // エリアフィルターの変更を監視してPOIをフィルタリング
  React.useEffect(() => {
    poi.filterPois(areaVisibility.areaVisibility);
  }, [areaVisibility.areaVisibility, poi]);

  // 位置情報が取得されたらマップのセンターを更新
  React.useEffect(() => {
    if (geolocation.state.currentLocation && map.state.isMapLoaded) {
      map.setCenter(geolocation.state.currentLocation);
    }
  }, [geolocation.state.currentLocation, map.state.isMapLoaded, map]);

  return (
    <AppContext.Provider
      value={{
        map,
        poi,
        geolocation,
        loading,
        areaVisibility,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// フック
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
