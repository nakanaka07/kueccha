// app.tsx: アプリケーションのエントリポイント
import React, { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useLoadScript } from "@react-google-maps/api"; // Google Maps API を読み込むためのフック
import { useSheetData } from "./useSheetData"; // スプレッドシートデータを取得するためのカスタムフック
import Map from "./Map"; // マップコンポーネント
import { AREAS } from "./appConstants"; // 定数

const App = () => {
  // 開発モードでのみコンソールログを出力
  if (import.meta.env.MODE === 'development') {
    console.log("App レンダリング");
  }

  // Google Maps API の読み込み状態を確認
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY, // APIキー
    mapIds: [import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_MAP_ID], // マップID
  });

  // 表示するエリアの配列（定数なのでuseMemo不要）
  const areas = Object.values(AREAS);

  // スプレッドシートからデータを取得
  const { pois: fetchedPois, isLoading, error } = useSheetData(areas);

  // 位置情報と ID を持つ POI のみフィルタリング。isLoading 中は空の配列を返す
  const pois = useMemo(() => {
    return isLoading ? [] : fetchedPois.filter((poi) => poi.location && poi.id);
  }, [isLoading, fetchedPois]);

  // API が読み込み中でない場合、「読み込み中…」を表示
  if (!isLoaded) {
    return <div>読み込み中...</div>;
  }

  // API の読み込みエラーまたはデータ取得エラーが発生した場合、エラーメッセージを表示
  if (loadError || error) {
    return <div>エラー: {loadError?.message || error}</div>;
  }

  // マップコンポーネントをレンダリング
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Map pois={pois} />
    </div>
  );
};


const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
