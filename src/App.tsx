import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Reactとフックをインポート
import { createRoot } from 'react-dom/client'; // ReactDOMのcreateRootをインポート
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary'; // ErrorBoundaryコンポーネントをインポート
import LoadingFallback from './components/loadingfallback/LoadingFallback'; // LoadingFallbackコンポーネントをインポート
import Map from './components/map/Map'; // Mapコンポーネントをインポート
import { ERROR_MESSAGES } from './utils/constants'; // エラーメッセージをインポート
import type { Poi, AreaType } from './utils/types'; // 型定義をインポート
import { useSheetData } from './hooks/useSheetData'; // useSheetDataフックをインポート
import { INITIAL_VISIBILITY } from './components/filterpanel/FilterPanel'; // INITIAL_VISIBILITYをインポート
import './App.css'; // スタイルをインポート

const App: React.FC = () => {
  const { pois } = useSheetData(); // POIデータを取得
  const [isLoaded, setIsLoaded] = useState(false); // ローディング状態を管理するローカルステート
  const [isMapLoaded, setIsMapLoaded] = useState(false); // マップのローディング状態を管理するローカルステート
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null); // 選択されたPOIを管理するローカルステート
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY); // エリアの表示状態を管理するローカルステート
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // フィルターパネルの開閉状態を管理するローカルステート

  // コンポーネントのマウント時にローディング完了状態を設定
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true); // ローディング完了状態を設定
    }, 3000); // 3秒後にローディング完了
    return () => clearTimeout(timer); // クリーンアップ関数でタイマーをクリア
  }, []);

  // ローディング完了時に初期背景を非表示にする
  useEffect(() => {
    if (isLoaded && isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background'); // 初期背景要素を取得
      if (backgroundElement) {
        setTimeout(() => {
          backgroundElement.classList.add('hidden'); // 初期背景を非表示にする
        }, 2000); // 2秒待機してからフェードアウト
      }
    }
  }, [isLoaded, isMapLoaded]);

  // ページの再読み込み時にselectedPoiを初期化する
  useEffect(() => {
    setSelectedPoi(null); // 選択されたPOIを初期化
  }, []);

  // フィルターパネルを開く関数
  const handleOpenFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(true); // フィルターパネルを開く
  }, []);

  // フィルターパネルを閉じる関数
  const handleCloseFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(false); // フィルターパネルを閉じる
  }, []);

  // マップのローディング完了時に呼び出される関数
  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true); // マップのローディング完了状態を設定
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <div
          className={`initial-background ${isLoaded && isMapLoaded ? 'hidden' : ''}`}
        />
        <div className="map-container">
          <Map
            pois={pois} // POIデータを渡す
            selectedPoi={selectedPoi} // 選択されたPOIを渡す
            setSelectedPoi={setSelectedPoi} // POIを選択する関数を渡す
            areaVisibility={areaVisibility} // エリアの表示状態を渡す
            onLoad={handleMapLoad} // マップのローディング完了時に呼び出される関数を渡す
            onCloseFilterPanel={handleCloseFilterPanel} // フィルターパネルを閉じる関数を渡す
            isFilterPanelOpen={isFilterPanelOpen} // フィルターパネルが開いているかどうかの状態を渡す
            setAreaVisibility={setAreaVisibility} // エリアの表示状態を設定する関数を渡す
            handleOpenFilterPanel={handleOpenFilterPanel} // フィルターパネルを開く関数を渡す
          />
        </div>
        {!isLoaded ? (
          <LoadingFallback isLoading={true} isLoaded={isLoaded} /> // ローディング中のフォールバックを表示
        ) : (
          <Suspense
            fallback={<LoadingFallback isLoading={true} isLoaded={isLoaded} />} // サスペンスフォールバックを設定
          >
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

// アプリケーションのエントリーポイントを設定
const container = document.getElementById('app'); // コンテナ要素を取得
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND); // コンテナ要素が見つからない場合はエラーをスロー

const root = createRoot(container); // ルートを作成
root.render(<App />); // アプリケーションをレンダリング
