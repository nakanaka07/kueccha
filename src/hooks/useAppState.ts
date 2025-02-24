// Reactのフックをインポート
import { useState, useEffect, useCallback } from 'react';
// 初期エリアの可視性を定義する定数をインポート
import { INITIAL_VISIBILITY } from '../utils/constants';
// 型定義をインポート
import type { Poi, AreaType, LatLngLiteral } from '../utils/types';

// useAppStateフックの定義
export const useAppState = (pois: Poi[]) => {
  // データがロードされたかどうかを管理する状態変数
  const [isLoaded, setIsLoaded] = useState(false);
  // マップがロードされたかどうかを管理する状態変数
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // 選択されたPOIを管理する状態変数
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  // エリアの可視性を管理する状態変数
  const [areaVisibility] = useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  // 現在の位置を管理する状態変数
  const [currentLocation] = useState<LatLngLiteral | null>(null);
  // 警告表示を管理する状態変数
  const [showWarning] = useState(false);
  // マップインスタンスを管理する状態変数
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // マップがロードされたときの処理を定義するコールバック関数
  const handleMapLoad = useCallback(
    (map: google.maps.Map | null) => {
      // マップが存在する場合、マップインスタンスを設定し、マップがロードされた状態にする
      if (map) {
        setMapInstance(map);
        setIsMapLoaded(true);
      }
    },
    [], // 依存関係は空のため、初回レンダリング時のみ実行される
  );

  // 検索結果がクリックされたときの処理を定義するコールバック関数
  const handleSearchResultClick = useCallback((poi: Poi) => {
    // 選択されたPOIを設定する
    setSelectedPoi(poi);
  }, []);

  // POIデータが変更されたときにデータがロードされた状態にする
  useEffect(() => {
    if (pois.length > 0) {
      setIsLoaded(true);
    }
  }, [pois]); // poisが変更されたときに実行される

  // フックが返す値とアクションを定義
  return {
    isLoaded, // データがロードされたかどうか
    isMapLoaded, // マップがロードされたかどうか
    selectedPoi, // 選択されたPOI
    areaVisibility, // エリアの可視性
    currentLocation, // 現在の位置
    showWarning, // 警告表示
    mapInstance, // マップインスタンス
    actions: {
      handleMapLoad, // マップがロードされたときの処理
      handleSearchResultClick, // 検索結果がクリックされたときの処理
    },
  };
};
