/**
 * マップコンポーネント
 *
 * Google Maps APIを使用して地図を表示するReactコンポーネント。
 * このコンポーネントは地図のロード、表示、エラー処理を担当し、
 * アクセシビリティにも配慮した実装となっている。
 */

// Google Maps APIのReactラッパーからコンポーネントとフックをインポート
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
// Reactの基本フックをインポート
import React, { useState, useCallback, useMemo, useEffect } from 'react';
// コンポーネント用のスタイルをインポート
import styles from './Map-module.css';
// エラー表示用のコンポーネントをインポート
import { MapError } from './MapError';
// 設定情報とエラーメッセージの定数をインポート
import { MAPS_CONFIG, ERROR_MESSAGES } from '../../utils/constants';
// 型定義をインポート
import type { MapComponentProps } from '../../utils/types';

// APIキーとmapIdの存在チェック（型アサーション）
// 設定が不足している場合はアプリケーション起動時にエラーを投げる
if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

// アクセシビリティ用のラベルを定数化
const MAP_ARIA_LABEL = '地図コンテンツ';
const LOADING_ARIA_LABEL = '地図読み込み中';

/**
 * マップコンポーネントの実装
 *
 * @param onLoad - マップがロードされたときに呼び出されるコールバック関数
 * @param setIsMapLoaded - マップのロード状態を親コンポーネントに通知するための関数
 */
export const Map: React.FC<MapComponentProps> = ({ onLoad, setIsMapLoaded }) => {
  // Google Maps APIをロードするためのフック
  // 設定オブジェクトで言語、バージョン、必要なライブラリなどを指定
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey,
    mapIds: [MAPS_CONFIG.mapId],
    libraries: MAPS_CONFIG.libraries,
    version: MAPS_CONFIG.version,
    language: MAPS_CONFIG.language,
  });

  // Google Map インスタンスを保持するための状態変数
  // 初期値は null で、マップがロードされると実際のインスタンスが設定される
  const [map, setMap] = useState<google.maps.Map | null>(() => null);

  // マップのオプション設定をメモ化して不要な再計算を防止
  // isLoadedの値が変わった時のみ再計算される
  const mapOptions = useMemo<google.maps.MapOptions>(() => {
    // マップがロードされていない場合は空オブジェクトを返す
    if (!isLoaded) return {};

    // constants.tsで定義された設定を基本として使用
    return {
      ...MAPS_CONFIG.options,
    };
  }, [isLoaded]);

  // マップロード時の処理をメモ化したコールバックとして定義
  const handleMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      if (mapInstance) {
        try {
          // 内部の状態にマップインスタンスを保存
          setMap(mapInstance);
          // 親コンポーネントにマップのロード完了を通知
          setIsMapLoaded(mapInstance);
          // 親から渡されたコールバックを実行
          onLoad(mapInstance);
        } catch (error) {
          console.error('Error during map load:', error);
        }
      }
    },
    [onLoad, setIsMapLoaded],
  );

  // コンポーネントがアンマウントされたときのクリーンアップ処理
  // マップインスタンスの参照を解放してメモリリークを防止
  useEffect(() => {
    return () => {
      if (map) {
        // 必要に応じてリスナーや他のリソースをクリーンアップ
        setMap(null);
      }
    };
  }, [map]); // map変数が変更されたときのみ再実行

  // GoogleMapコンポーネントをメモ化して不要な再レンダリングを防止
  const MemoizedGoogleMap = useMemo(
    () => (
      <GoogleMap
        mapContainerStyle={MAPS_CONFIG.style} // マップコンテナのCSSスタイル
        center={MAPS_CONFIG.defaultCenter} // マップの初期中心座標
        zoom={MAPS_CONFIG.defaultZoom} // マップの初期ズームレベル
        options={mapOptions} // マップの表示オプション
        onLoad={handleMapLoad} // マップロード時のコールバック
      />
    ),
    [mapOptions, handleMapLoad], // 依存配列：これらの値が変わったときのみ再生成
  );

  // API読み込みエラー時の表示
  // エラーが最優先で処理される
  if (loadError) {
    return (
      <MapError
        message={ERROR_MESSAGES.MAP.LOAD_FAILED} // エラーメッセージ
        onRetry={() => window.location.reload()} // リトライ処理
      />
    );
  }

  // マップ読み込み中の表示
  // エラーがなく、まだロードが完了していない場合に表示
  if (!isLoaded) {
    return (
      <div
        className={styles.loadingContainer}
        role="status" // スクリーンリーダー向けロール
        aria-label={LOADING_ARIA_LABEL} // アクセシビリティラベル
      >
        地図を読み込んでいます...
      </div>
    );
  }

  // マップが正常にロードされた場合の表示
  // マップコンテナはアクセシビリティに配慮した属性を持つ
  return (
    <div
      role="region" // 地図領域であることを示すロール
      aria-label={MAP_ARIA_LABEL} // スクリーンリーダー用の説明
      className={styles.mapContainer} // スタイル適用
      tabIndex={0} // キーボードフォーカス可能にする
    >
      {MemoizedGoogleMap}
    </div>
  );
};

// React DevToolsでの識別用にコンポーネント名を明示的に設定
Map.displayName = 'Map';

export default Map;
