// Reactと必要なフックをインポートします。
import React, { useState, useEffect } from 'react';
// React 18の新しいルートAPIをインポートします。
import { createRoot } from 'react-dom/client';
// スタイルシートをインポートします。
import './App.css';
// エラーバウンダリーコンポーネントをインポートします。
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
// フィードバックフォームコンポーネントをインポートします。
import FeedbackForm from './components/feedback/FeedbackForm';
// フィルターパネルコンポーネントをインポートします。
import FilterPanel from './components/filterpanel/FilterPanel';
// ハンバーガーメニューコンポーネントをインポートします。
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu';
// ローディング中のフォールバックコンポーネントをインポートします。
import LoadingFallback from './components/loadingfallback/LoadingFallback';
// 地図コンポーネントをインポートします。
import Map from './components/map/Map';
// アプリケーションの状態管理フックをインポートします。
import { useAppState } from './hooks/useAppState';
// 検索機能のフックをインポートします。
import useSearch from './hooks/useSearch';
// シートデータを取得するフックをインポートします。
import { useSheetData } from './hooks/useSheetData';
// エラーメッセージの定数をインポートします。
import { ERROR_MESSAGES } from './utils/constants';
// 型定義をインポートします。
import { Poi, AreaType, LatLngLiteral } from './utils/types';

// Appコンポーネントはアプリケーションのメインコンポーネントです。
// データの取得、検索、状態管理、エラーハンドリングなどを行います。
const App: React.FC = () => {
  // useSheetDataフックを使用してデータを取得します。
  const { pois, isLoading, error, refetch } = useSheetData();
  // useSearchフックを使用して検索機能を提供します。
  const { searchResults, search } = useSearch(pois);
  // アプリケーションの状態管理フックを使用して、必要な状態とアクションを取得します。
  const {
    isLoaded, // データがロードされたかどうかを示すフラグ
    isMapLoaded, // 地図がロードされたかどうかを示すフラグ
    selectedPoi, // 現在選択されているPOI
    areaVisibility, // 各エリアの可視性を管理するオブジェクト
    currentLocation, // 現在の位置情報
    showWarning, // 警告を表示するかどうかのフラグ
    actions, // 状態を変更するためのアクション
  } = useAppState(pois);

  // フィードバックフォームの表示状態を管理するための状態を定義します。
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);

  // 表示するPOI（ポイントオブインタレスト）を決定します。
  const displayedPois = searchResults.length > 0 ? searchResults : pois;
  // 初期ロード中かどうかを判定します。
  const isInitialLoading = isLoading || !isLoaded || !isMapLoaded;

  // ローカル状態を定義し、useEffectを使用してグローバル状態の変更を反映します。
  const [localSelectedPoi, setLocalSelectedPoi] = useState<Poi | null>(
    selectedPoi,
  );
  const [localAreaVisibility, setLocalAreaVisibility] =
    useState<Record<AreaType, boolean>>(areaVisibility); // エリアの可視性を管理するローカル状態
  const [localCurrentLocation, setLocalCurrentLocation] =
    useState<LatLngLiteral | null>(currentLocation); // 現在の位置情報を管理するローカル状態
  const [localShowWarning, setLocalShowWarning] =
    useState<boolean>(showWarning); // 警告表示を管理するローカル状態

  // グローバル状態のselectedPoiが変更された場合にローカル状態を更新します。
  useEffect(() => {
    setLocalSelectedPoi(selectedPoi);
  }, [selectedPoi]);

  // グローバル状態のareaVisibilityが変更された場合にローカル状態を更新します。
  useEffect(() => {
    setLocalAreaVisibility(areaVisibility);
  }, [areaVisibility]);

  // グローバル状態のcurrentLocationが変更された場合にローカル状態を更新します。
  useEffect(() => {
    setLocalCurrentLocation(currentLocation);
  }, [currentLocation]);

  // グローバル状態のshowWarningが変更された場合にローカル状態を更新します。
  useEffect(() => {
    setLocalShowWarning(showWarning);
  }, [showWarning]);

  // エラーが発生した場合の表示を定義します。
  if (error) {
    return (
      <div className="error-message" role="alert">
        <p>エラーが発生しました: {error.message}</p>
        <p>再試行するには以下のボタンをクリックしてください。</p>
        <button onClick={refetch}>再試行</button>
      </div>
    );
  }

  // 初期ロード中の表示を定義します。
  if (isInitialLoading) {
    return (
      // LoadingFallbackコンポーネントはデータのロード中に表示されるフォールバックUIを提供します。
      <LoadingFallback
        isLoading={isInitialLoading} // ロード中かどうかのフラグ
        isLoaded={!isInitialLoading} // ロードが完了したかどうかのフラグ
        message="データをロードしています。しばらくお待ちください。" // ロード中に表示するメッセージ
      />
    );
  }

  // メインのアプリケーションUIをレンダリングします。
  return (
    <div className="app">
      <ErrorBoundary>
        <div className="app-container">
          {/* Mapコンポーネントは地図を表示し、POIの選択やエリアの可視性を管理します。 */}
          <Map
            pois={displayedPois} // 表示するPOIのリスト
            selectedPoi={localSelectedPoi} // 現在選択されているPOI
            setSelectedPoi={setLocalSelectedPoi} // POIを選択するための関数
            areaVisibility={localAreaVisibility} // エリアの可視性を管理するオブジェクト
            onLoad={actions.handleMapLoad} // 地図がロードされたときに呼ばれる関数
            setAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定するための関数
            currentLocation={localCurrentLocation} // 現在の位置情報
            setCurrentLocation={setLocalCurrentLocation} // 現在の位置情報を設定するための関数
            showWarning={localShowWarning} // 警告を表示するかどうかのフラグ
            setShowWarning={setLocalShowWarning} // 警告表示を設定するための関数
          />
          {/* HamburgerMenuコンポーネントはハンバーガーメニューを表示し、検索やPOIの選択を管理します。 */}
          <HamburgerMenu
            pois={displayedPois} // 表示するPOIのリスト
            setSelectedPoi={setLocalSelectedPoi} // POIを選択するための関数
            setAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定するための関数
            localAreaVisibility={localAreaVisibility} // エリアの可視性を管理するローカル状態
            setLocalAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定するための関数
            currentLocation={localCurrentLocation} // 現在の位置情報
            setCurrentLocation={setLocalCurrentLocation} // 現在の位置情報を設定するための関数
            setShowWarning={setLocalShowWarning} // 警告表示を設定するための関数
            search={search} // 検索関数
            searchResults={searchResults} // 検索結果のリスト
            handleSearchResultClick={actions.handleSearchResultClick} // 検索結果がクリックされたときに呼ばれる関数
          />
          {/* FilterPanelコンポーネントはフィルターパネルを表示し、エリアの可視性を管理します。 */}
          <FilterPanel
            pois={displayedPois} // 表示するPOIのリスト
            setSelectedPoi={setLocalSelectedPoi} // POIを選択するための関数
            setAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定するための関数
            isFilterPanelOpen={true} // フィルターパネルが開いているかどうかのフラグ
            onCloseClick={() => {}} // フィルターパネルを閉じるための関数
            localAreaVisibility={localAreaVisibility} // エリアの可視性を管理するローカル状態
            setLocalAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定するための関数
            currentLocation={localCurrentLocation} // 現在の位置情報
            setCurrentLocation={setLocalCurrentLocation} // 現在の位置情報を設定するための関数
            setShowWarning={setLocalShowWarning} // 警告表示を設定するための関数
          />
          {/* データを再取得するためのボタン */}
          <button onClick={refetch}>データを更新</button>
          {/* フィードバックフォームを開くためのボタン */}
          <button onClick={() => setIsFeedbackFormOpen(true)}>
            フィードバックを送信
          </button>
          {/* フィードバックフォームの表示 */}
          {isFeedbackFormOpen && (
            <FeedbackForm onClose={() => setIsFeedbackFormOpen(false)} />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

// アプリケーションのルート要素を取得し、Reactアプリケーションをレンダリングします。
const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

// Reactアプリケーションをルート要素にレンダリングします。
const root = createRoot(container);
root.render(<App />);
