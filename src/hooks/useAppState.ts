// ReactのuseState, useEffect, useCallbackフックをインポートします。
// useState: 状態変数を定義するために使用します。
// useEffect: 副作用を処理するために使用します。
// useCallback: メモ化されたコールバック関数を作成するために使用します。
import { useState, useEffect, useCallback } from 'react';
// 定数をインポートします。
// INITIAL_VISIBILITY: エリアの初期表示状態を定義します。
// LOADING_DELAY: ローディング状態の遅延時間を定義します。
// BACKGROUND_HIDE_DELAY: 背景を非表示にする遅延時間を定義します。
import {
  INITIAL_VISIBILITY,
  LOADING_DELAY,
  BACKGROUND_HIDE_DELAY,
} from '../utils/constants';
// 型をインポートします。
// Poi: ポイントオブインタレストの型を定義します。
// AreaType: エリアの種類を定義します。
// LatLngLiteral: 緯度と経度を表すオブジェクトの型です。
import { Poi, AreaType, LatLngLiteral } from '../utils/types';

// useAppStateフックを定義します。引数としてポイントオブインタレストの配列を受け取ります。
export const useAppState = (pois: Poi[]) => {
  // 状態変数を定義します。
  // isLoaded: アプリケーションがロードされたかどうかを示します。初期値はfalseです。
  // isMapLoaded: マップがロードされたかどうかを示します。初期値はfalseです。
  // selectedPoi: 選択されたポイントオブインタレストを示します。初期値はnullです。
  // areaVisibility: エリアの表示状態を示します。初期値はINITIAL_VISIBILITYです。
  // currentLocation: 現在地を示します。初期値はnullです。
  // showWarning: 警告を表示するかどうかを示します。初期値はfalseです。
  const [state, setState] = useState({
    isLoaded: false,
    isMapLoaded: false,
    selectedPoi: null as Poi | null,
    areaVisibility: INITIAL_VISIBILITY,
    currentLocation: null as LatLngLiteral | null,
    showWarning: false,
  });

  // アプリケーションのロード状態を管理するuseEffectフックです。
  // LOADING_DELAY後にisLoadedをtrueに設定します。
  useEffect(() => {
    const timer = setTimeout(
      () => setState((prev) => ({ ...prev, isLoaded: true })),
      LOADING_DELAY,
    );
    return () => clearTimeout(timer); // クリーンアップ関数でタイマーをクリアします。
  }, []); // 依存配列が空のため、このエフェクトは初回マウント時にのみ実行されます。

  // マップとアプリケーションのロード状態を監視するuseEffectフックです。
  // 両方がロードされた場合、背景要素を非表示にします。
  useEffect(() => {
    if (state.isLoaded && state.isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background');
      if (backgroundElement) {
        const timer = setTimeout(() => {
          backgroundElement.classList.add('hidden');
        }, BACKGROUND_HIDE_DELAY);
        return () => clearTimeout(timer); // クリーンアップ関数でタイマーをクリアします。
      }
    }
  }, [state.isLoaded, state.isMapLoaded]); // isLoadedとisMapLoadedが変更された場合に実行されます。

  // ポイントオブインタレストが変更された場合にselectedPoiをリセットするuseEffectフックです。
  useEffect(() => {
    setState((prev) => ({ ...prev, selectedPoi: null }));
  }, [pois]); // poisが変更された場合に実行されます。

  // マップがロードされたときにisMapLoadedを更新するコールバック関数です。
  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setState((prev) => ({ ...prev, isMapLoaded: !!mapInstance }));
  }, []); // 依存配列が空のため、この関数は初回マウント時にのみ生成されます。

  // 検索結果のポイントオブインタレストがクリックされたときにselectedPoiを更新する関数です。
  const handleSearchResultClick = (poi: Poi) => {
    setState((prev) => ({ ...prev, selectedPoi: poi }));
  };

  // フックが返すオブジェクトです。状態変数とアクション関数を含みます。
  return {
    ...state,
    actions: {
      // selectedPoiを更新する関数です。
      setSelectedPoi: (poi: Poi | null) =>
        setState((prev) => ({ ...prev, selectedPoi: poi })),
      // areaVisibilityを更新する関数です。
      setAreaVisibility: (visibility: Record<AreaType, boolean>) =>
        setState((prev) => ({ ...prev, areaVisibility: visibility })),
      // currentLocationを更新する関数です。
      setCurrentLocation: (location: LatLngLiteral | null) =>
        setState((prev) => ({ ...prev, currentLocation: location })),
      // showWarningを更新する関数です。
      setShowWarning: (show: boolean) =>
        setState((prev) => ({ ...prev, showWarning: show })),
      // マップがロードされたときのコールバック関数です。
      handleMapLoad,
      // 検索結果のポイントオブインタレストがクリックされたときの関数です。
      handleSearchResultClick,
    },
  };
};
