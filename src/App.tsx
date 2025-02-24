// Reactとフックをインポート
import React, { useState, useEffect } from 'react';
// ReactDOMのcreateRootをインポート
import { createRoot } from 'react-dom/client';
// CSSファイルをインポート
import './App.css';
// エラーバウンダリコンポーネントをインポート
import { ErrorBoundary } from './components/errorboundary/ErrorBoundary';
// フィードバックフォームコンポーネントをインポート
import FeedbackForm from './components/feedback/FeedbackForm';
// フィルターパネルコンポーネントをインポート
import FilterPanel from './components/filterpanel/FilterPanel';
// ハンバーガーメニューコンポーネントをインポート
import HamburgerMenu from './components/hamburgermenu/HamburgerMenu';
// ローディングフォールバックコンポーネントをインポート
import LoadingFallback from './components/loadingfallback/LoadingFallback';
// マップコンポーネントをインポート
import Map from './components/map/Map';
// カスタムフックをインポート
import { useAppState } from './hooks/useAppState';
import useSearch from './hooks/useSearch';
import { useSheetData } from './hooks/useSheetData';
// 定数をインポート
import { ERROR_MESSAGES } from './utils/constants';
// 型定義をインポート
import { Poi, AreaType, LatLngLiteral } from './utils/types';

// Appコンポーネントの定義
const App: React.FC = () => {
  // シートデータを取得するカスタムフックを使用
  const { pois, isLoading, error, refetch, isLoaded } = useSheetData();
  // 検索機能を提供するカスタムフックを使用
  const { searchResults, search } = useSearch(pois);
  // アプリケーションの状態を管理するカスタムフックを使用
  const { selectedPoi, areaVisibility, currentLocation, showWarning, actions } = useAppState(pois);

  // フィードバックフォームの表示状態を管理するステート
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  // 表示するPOIを決定
  const displayedPois = searchResults.length > 0 ? searchResults : pois;
  // 初期ローディング状態を管理
  const isInitialLoading = isLoading || !isLoaded;

  // ローカルステートを定義し、グローバルステートの変更を監視
  const [localSelectedPoi, setLocalSelectedPoi] = useState<Poi | null>(selectedPoi);
  const [localAreaVisibility, setLocalAreaVisibility] = useState<Record<AreaType, boolean>>(areaVisibility);
  const [localCurrentLocation, setLocalCurrentLocation] = useState<LatLngLiteral | null>(currentLocation);
  const [localShowWarning, setLocalShowWarning] = useState<boolean>(showWarning);

  // selectedPoiが変更されたときにローカルステートを更新
  useEffect(() => {
    setLocalSelectedPoi(selectedPoi);
  }, [selectedPoi]);

  // areaVisibilityが変更されたときにローカルステートを更新
  useEffect(() => {
    setLocalAreaVisibility(areaVisibility);
  }, [areaVisibility]);

  // currentLocationが変更されたときにローカルステートを更新
  useEffect(() => {
    setLocalCurrentLocation(currentLocation);
  }, [currentLocation]);

  // showWarningが変更されたときにローカルステートを更新
  useEffect(() => {
    setLocalShowWarning(showWarning);
  }, [showWarning]);

  // エラーが発生した場合のエラーハンドリング
  if (error) {
    return (
      <ErrorBoundary>
        <div>Error: {error.message}</div>
        <button onClick={refetch}>Retry</button>
      </ErrorBoundary>
    );
  }

  // 初期ローディング状態の場合のローディング表示
  if (isInitialLoading) {
    return (
      <LoadingFallback
        isLoading={isInitialLoading}
        isLoaded={!isInitialLoading}
        message="データをロードしています。しばらくお待ちください。"
      />
    );
  }

  // メインのアプリケーションUIをレンダリング
  return (
    <div className="app">
      <ErrorBoundary>
        <div className="app-container">
          <Map
            pois={displayedPois} // 表示するPOI
            selectedPoi={localSelectedPoi} // 選択されたPOI
            setSelectedPoi={setLocalSelectedPoi} // POI選択を設定する関数
            areaVisibility={localAreaVisibility} // エリアの可視性
            onLoad={(mapInstance) => {
              actions.handleMapLoad(mapInstance); // マップがロードされたときの処理
            }}
            setAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定する関数
            currentLocation={localCurrentLocation} // 現在の位置
            setCurrentLocation={setLocalCurrentLocation} // 現在の位置を設定する関数
            showWarning={localShowWarning} // 警告表示
            setShowWarning={setLocalShowWarning} // 警告表示を設定する関数
            setIsMapLoaded={actions.handleMapLoad} // マップがロードされたときの処理
          />
          <HamburgerMenu
            pois={displayedPois} // 表示するPOI
            setSelectedPoi={setLocalSelectedPoi} // POI選択を設定する関数
            setAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定する関数
            localAreaVisibility={localAreaVisibility} // ローカルのエリア可視性
            setLocalAreaVisibility={setLocalAreaVisibility} // ローカルのエリア可視性を設定する関数
            currentLocation={localCurrentLocation} // 現在の位置
            setCurrentLocation={setLocalCurrentLocation} // 現在の位置を設定する関数
            setShowWarning={setLocalShowWarning} // 警告表示を設定する関数
            search={search} // 検索関数
            searchResults={searchResults} // 検索結果
            handleSearchResultClick={(poi) => {
              actions.handleSearchResultClick(poi); // 検索結果がクリックされたときの処理
            }}
          />
          <FilterPanel
            pois={displayedPois} // 表示するPOI
            setSelectedPoi={setLocalSelectedPoi} // POI選択を設定する関数
            setAreaVisibility={setLocalAreaVisibility} // エリアの可視性を設定する関数
            isFilterPanelOpen={true} // フィルターパネルの表示状態
            onCloseClick={() => {
              // フィルターパネルが閉じられたときの処理
            }}
            localAreaVisibility={localAreaVisibility} // ローカルのエリア可視性
            setLocalAreaVisibility={setLocalAreaVisibility} // ローカルのエリア可視性を設定する関数
            currentLocation={localCurrentLocation} // 現在の位置
            setCurrentLocation={setLocalCurrentLocation} // 現在の位置を設定する関数
            setShowWarning={setLocalShowWarning} // 警告表示を設定する関数
          />
          <button
            onClick={() => {
              refetch(); // データを再取得する処理
            }}
          >
            データを更新
          </button>
          <button
            onClick={() => {
              setIsFeedbackFormOpen(true); // フィードバックフォームを開く処理
            }}
          >
            フィードバックを送信
          </button>
          {isFeedbackFormOpen && (
            <FeedbackForm
              onClose={() => {
                setIsFeedbackFormOpen(false); // フィードバックフォームを閉じる処理
              }}
            />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

// アプリケーションのルートコンテナを取得
const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

// Reactのルートを作成し、Appコンポーネントをレンダリング
const root = createRoot(container);
root.render(<App />);
