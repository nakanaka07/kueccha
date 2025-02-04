import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Reactと必要なフックをインポート
import { createRoot } from 'react-dom/client'; // React 18の新しいルートAPIをインポート
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary'; // エラーバウンダリコンポーネントをインポート
import LoadingFallback from './components/loadingfallback/LoadingFallback'; // ローディングフォールバックコンポーネントをインポート
import Map from './components/map/Map'; // マップコンポーネントをインポート
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu'; // ハンバーガーメニューコンポーネントをインポート
import { ERROR_MESSAGES } from './utils/constants'; // エラーメッセージ定数をインポート
import { useSheetData } from './hooks/useSheetData'; // カスタムフックをインポート
import { INITIAL_VISIBILITY } from './components/filterpanel/FilterPanel'; // 初期表示設定をインポート
import { Poi, AreaType, LatLngLiteral } from './utils/types'; // 型定義をインポート
import './App.css'; // スタイルシートをインポート

const App: React.FC = () => {
  const { pois } = useSheetData(); // カスタムフックからPOIデータを取得
  const [isLoaded, setIsLoaded] = useState(false); // ロード状態を管理するステート
  const [isMapLoaded, setIsMapLoaded] = useState(false); // マップのロード状態を管理するステート
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null); // 選択されたPOIを管理するステート
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY); // エリアの表示状態を管理するステート
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(
    null,
  ); // 現在の位置を管理するステート

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true); // 2秒後にロード状態をtrueに設定
    }, 2000);
    return () => clearTimeout(timer); // クリーンアップ関数でタイマーをクリア
  }, []);

  useEffect(() => {
    if (isLoaded && isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background'); // 初期背景要素を取得
      if (backgroundElement) {
        setTimeout(() => {
          backgroundElement.classList.add('hidden'); // 2秒後に背景を非表示にするクラスを追加
        }, 2000);
      }
    }
  }, [isLoaded, isMapLoaded]); // isLoadedとisMapLoadedが変更されたときに実行

  useEffect(() => {
    setSelectedPoi(null); // コンポーネントのマウント時に選択されたPOIをリセット
  }, []);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true); // マップがロードされたときに呼び出されるコールバック
  }, []);

  return (
    <ErrorBoundary>
      {' '}
      {/* エラーバウンダリでラップ */}
      <div className="app-container">
        {' '}
        {/* アプリ全体のコンテナ */}
        <div
          className={`initial-background ${isLoaded && isMapLoaded ? 'hidden' : ''}`}
        />{' '}
        {/* 初期背景 */}
        <div className="map-container">
          {' '}
          {/* マップコンテナ */}
          <Map
            pois={pois} // POIデータを渡す
            selectedPoi={selectedPoi} // 選択されたPOIを渡す
            setSelectedPoi={setSelectedPoi} // POI選択を設定する関数を渡す
            areaVisibility={areaVisibility} // エリアの表示状態を渡す
            onLoad={handleMapLoad} // マップロード時のコールバックを渡す
            setAreaVisibility={setAreaVisibility} // エリア表示状態を設定する関数を渡す
            currentLocation={currentLocation} // 現在の位置を渡す
            setCurrentLocation={setCurrentLocation} // 現在の位置を設定する関数を渡す
          />
        </div>
        <HamburgerMenu
          pois={pois} // POIデータを渡す
          setSelectedPoi={setSelectedPoi} // POI選択を設定する関数を渡す
          setAreaVisibility={setAreaVisibility} // エリア表示状態を設定する関数を渡す
          localAreaVisibility={areaVisibility} // ローカルエリアの表示状態を渡す
          setLocalAreaVisibility={setAreaVisibility} // ローカルエリア表示状態を設定する関数を渡す
          currentLocation={currentLocation} // 現在の位置を渡す
          setCurrentLocation={setCurrentLocation} // 現在の位置を設定する関数を渡す
        />
        {!isLoaded ? (
          <LoadingFallback isLoading={true} isLoaded={isLoaded} /> // ロード中のフォールバックを表示
        ) : (
          <Suspense
            fallback={<LoadingFallback isLoading={true} isLoaded={isLoaded} />}
          >
            {/* 他のコンポーネント */}
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
};

const container = document.getElementById('app'); // ルート要素を取得
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND); // ルート要素が見つからない場合はエラーをスロー

const root = createRoot(container); // ルートを作成
root.render(<App />); // アプリをレンダリング
