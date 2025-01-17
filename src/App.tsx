import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Reactとフックをインポート
import { createRoot } from 'react-dom/client'; // ReactDOMのcreateRootをインポート
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary'; // ErrorBoundaryコンポーネントをインポート
import LoadingFallback from './components/loadingfallback/LoadingFallback'; // LoadingFallbackコンポーネントをインポート
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu'; // HamburgerMenuコンポーネントをインポート
import Map from './components/map/Map'; // Mapコンポーネントをインポート
import FilterPanel, {
  INITIAL_VISIBILITY,
} from './components/filterpanel/FilterPanel'; // FilterPanelコンポーネントと初期表示状態をインポート
import { ERROR_MESSAGES } from './utils/constants'; // エラーメッセージをインポーネット
import type { Poi, AreaType } from './utils/types'; // 型定義をインポート
import { useSheetData } from './hooks/useSheetData'; // useSheetDataフックをインポート
import './App.css'; // スタイルをインポート

const App: React.FC = () => {
  const { pois } = useSheetData(); // POIデータを取得
  const [isLoaded, setIsLoaded] = useState(false); // ローディング状態を管理するローカルステート
  const [isMapLoaded, setIsMapLoaded] = useState(false); // マップのローディング状態を管理するローカルステート
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null); // 選択されたPOIを管理するローカルステート
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY); // エリアの表示状態を管理するローカルステート
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // フィルターパネルの開閉状態を管理するローカルステート

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true); // ローディング完了状態を設定
    }, 2000);
    return () => clearTimeout(timer); // クリーンアップ関数でタイマーをクリア
  }, []);

  useEffect(() => {
    if (isLoaded && isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background'); // 初期背景要素を取得
      if (backgroundElement) {
        backgroundElement.classList.add('hidden'); // 初期背景を非表示にする
      }
    }
  }, [isLoaded, isMapLoaded]);

  // ページの再読み込み時にselectedPoiを初期化する
  useEffect(() => {
    setSelectedPoi(null); // 選択されたPOIを初期化
  }, []);

  const handleOpenFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(true); // フィルターパネルを開く
  }, []);

  const handleCloseFilterPanel = useCallback(() => {
    console.log('Closing filter panel'); // デバッグメッセージを追加
    setIsFilterPanelOpen(false); // フィルターパネルを閉じる
  }, []);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true); // マップのローディング完了状態を設定
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <div
          className={`initial-background ${isLoaded && isMapLoaded ? 'hidden' : ''}`}
        />
        {!isLoaded ? (
          <LoadingFallback isLoading={true} isLoaded={isLoaded} /> // ローディング中のフォールバックを表示
        ) : (
          <Suspense
            fallback={<LoadingFallback isLoading={true} isLoaded={isLoaded} />} // サスペンスフォールバックを設定
          >
            <HamburgerMenu
              pois={pois}
              setSelectedPoi={setSelectedPoi}
              setAreaVisibility={setAreaVisibility}
              onOpenFilterPanel={handleOpenFilterPanel}
            />
            <div className="map-container">
              <Map
                pois={pois}
                selectedPoi={selectedPoi}
                setSelectedPoi={setSelectedPoi}
                areaVisibility={areaVisibility}
                onLoad={handleMapLoad}
                onCloseFilterPanel={handleCloseFilterPanel}
              />
              {isFilterPanelOpen && (
                <FilterPanel
                  pois={pois}
                  setSelectedPoi={setSelectedPoi}
                  setAreaVisibility={setAreaVisibility}
                  isFilterPanelOpen={isFilterPanelOpen}
                  onCloseClick={handleCloseFilterPanel}
                />
              )}
            </div>
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

const container = document.getElementById('app'); // コンテナ要素を取得
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND); // コンテナ要素が見つからない場合はエラーをスロー

const root = createRoot(container); // ルートを作成
root.render(<App />); // アプリケーションをレンダリング
