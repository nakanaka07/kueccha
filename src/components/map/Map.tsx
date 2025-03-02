/**
 * Map.tsx
 *
 * @description
 * Google Maps APIを使用して地図を表示するReactコンポーネント。
 * アプリケーション内で地図の表示、操作、およびイベント処理を担当し、
 * 地図のロード状態や表示に関するエラーハンドリングも行います。
 *
 * @usage
 * 以下のようなケースで使用します：
 * - 位置情報の視覚的表示が必要なアプリケーション
 * - マーカーやポリゴンなどの地理情報を表示する画面
 * - ユーザーの現在地を中心とした地図表示
 * - 店舗や施設の位置情報表示
 *
 * @features
 * - Google Maps APIの非同期ロード処理
 * - エラー状態の適切な処理と再試行機能
 * - アクセシビリティ対応（ARIA属性の適用）
 * - 地図インスタンスの参照管理
 * - カスタマイズ可能な地図オプション
 *
 * @props
 * - onLoad: (map: google.maps.Map) => void - 地図が正常に読み込まれたときに呼び出されるコールバック関数。
 *   親コンポーネントが地図インスタンスを取得するために使用します。
 *
 * @example
 * // 基本的な使用例
 * <Map onLoad={(mapInstance) => setMap(mapInstance)} />
 *
 * // エラーバウンダリと組み合わせた使用例
 * <ErrorBoundary fallback={<div>地図の読み込みに失敗しました</div>}>
 *   <Map onLoad={handleMapLoad} />
 * </ErrorBoundary>
 *
 * @bestPractices
 * - 地図インスタンスの操作は親コンポーネントに委譲し、このコンポーネントは表示に集中する
 * - 地図関連の設定値は定数ファイルに集約し、ハードコーディングを避ける
 * - ロード状態とエラー状態を明示的に処理し、ユーザーに適切なフィードバックを提供する
 * - パフォーマンスのためにuseCallbackを使用してコールバック関数をメモ化する
 *
 * @dependencies
 * - @react-google-maps/api: Google Maps APIのReactラッパー
 * - MapError: 地図ロードエラー時の表示コンポーネント
 * - MAPS_CONFIG: 地図の設定値（APIキー、マップID、デフォルト位置など）
 * - ERROR_MESSAGES: エラーメッセージ定数
 */

import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useRef, useState } from 'react';
import styles from './Map.module.css';
import MapError from './MapError';
import { ERROR_MESSAGES, MAPS_CONFIG } from '../../utils/constants';
import { MapComponentProps, Poi, AreaType } from '../../utils/types';
import { Marker } from '../marker/Marker';

// マーカーの表示優先度を決定する関数
const getMarkerZIndex = (areaType: AreaType): number => {
  switch (areaType) {
    case 'RECOMMEND':
      return 100; // 推奨エリアは最前面に表示
    case 'CURRENT_LOCATION':
      return 90; // 現在地は次に前面
    default:
      return 10; // その他のエリアは後ろに表示
  }
};

/**
 * 起動時の設定検証
 *
 * 必須の設定値（APIキーとマップID）が存在するか確認し、
 * 存在しない場合はアプリケーション起動時にエラーをスローします。
 */
if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
  throw new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING);
}

/**
 * アクセシビリティのための定数
 *
 * スクリーンリーダーなどの支援技術に適切な情報を提供するための
 * ARIA属性に使用される文字列定数です。
 */
const MAP_ARIA_LABEL = '地図コンテンツ';
const LOADING_ARIA_LABEL = '地図読み込み中';

/**
 * マップコンポーネントの実装
 *
 * Google Maps APIを使用して地図を表示し、ロード状態や
 * エラー状態に応じて適切なUIを提供します。
 *
 * @param onLoad - マップがロードされたときに呼び出されるコールバック関数
 */
interface ExtendedMapProps extends MapComponentProps {
  pois?: Poi[]; // 表示するPOIデータの配列
  selectedPoi?: Poi | null; // 選択中のPOI
  onMarkerClick?: (poi: Poi) => void; // マーカークリック時のコールバック
}

export const Map: React.FC<ExtendedMapProps> = ({
  onLoad,
  pois = [], // デフォルト値を空配列に
  selectedPoi = null, // デフォルト値をnullに
  onMarkerClick = () => {}, // デフォルトの空関数
}) => {
  /**
   * Google Maps APIのロード処理
   *
   * useLoadScriptフックを使用してAPIのロードを管理し、
   * ロード状態（isLoaded）とエラー状態（loadError）を取得します。
   */
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey,
    mapIds: [MAPS_CONFIG.mapId],
    libraries: MAPS_CONFIG.libraries,
    version: MAPS_CONFIG.version,
    language: MAPS_CONFIG.language,
  });

  /**
   * 地図インスタンスの参照を保持
   *
   * useRefフックを使用してGoogle Maps APIのMapインスタンスを参照として保持し、
   * コンポーネントの再レンダリング間でも一貫した参照を維持します。
   */
  const mapRef = useRef<google.maps.Map | null>(null);

  /**
   * マップ表示時のエラー状態を管理
   *
   * APIのロードは成功したが、マップの初期化や表示時に発生する
   * エラーを管理するための状態です。
   */
  const [mapError, setMapError] = useState<Error | null>(null);

  /**
   * マップがロードされたときのコールバック関数
   *
   * 地図の初期設定を行い、親コンポーネントにマップインスタンスを渡します。
   * useCallbackでメモ化することで不要な再レンダリングを防ぎます。
   */
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (onLoad) {
        onLoad(map);
      }
    },
    [onLoad],
  );

  /**
   * エラー発生時の再試行処理
   *
   * エラー状態をリセットし、ページをリロードすることで
   * 地図の再読み込みを試みます。
   */
  const handleRetry = useCallback(() => {
    setMapError(null);
    window.location.reload();
  }, []);

  // ロード中の表示
  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer} aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
        マップを読み込み中...
      </div>
    );
  }

  // API読み込みエラーの表示
  if (loadError) {
    return <MapError message={loadError.message || ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={handleRetry} />;
  }

  // マップ表示エラーの表示
  if (mapError) {
    return <MapError message={mapError.message || ERROR_MESSAGES.MAP.LOAD_FAILED} onRetry={handleRetry} />;
  }

  // 地図の表示
  return (
    <div className={styles.mapContainer}>
      <GoogleMap
        mapContainerClassName={styles.mapContainer}
        center={MAPS_CONFIG.defaultCenter}
        zoom={MAPS_CONFIG.defaultZoom}
        options={{
          mapId: MAPS_CONFIG.mapId,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          disableDoubleClickZoom: false,
          scrollwheel: true,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          clickableIcons: true,
          gestureHandling: 'cooperative',
          mapTypeControlOptions: {
            // Google Maps API がロードされる前の静的定義のため数値を使用
            style: 2, // DROPDOWN_MENU の定数値（2）
            position: 1, // TOP_LEFT の定数値（1）
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'], // 利用可能なマップタイプ
          },
        }}
        onLoad={handleMapLoad}
        aria-label={MAP_ARIA_LABEL}
      >
        {/* マーカーを地図上に表示 */}
        {mapRef.current &&
          pois.map((poi) => (
            <Marker
              key={poi.id}
              poi={poi}
              map={mapRef.current}
              onClick={onMarkerClick} // クリック時のコールバック
              isSelected={selectedPoi?.id === poi.id} // 選択状態を渡す
              zIndex={getMarkerZIndex(poi.area)} // エリアタイプに基づいたzIndex値を設定
            />
          ))}
      </GoogleMap>
    </div>
  );
};

// コンポーネントに明示的な表示名を設定（デバッグ時に役立つ）
Map.displayName = 'Map';

export default Map;
