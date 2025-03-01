import { useState, useCallback } from 'react';

/**
 * Google Maps状態を管理するカスタムフック
 *
 * このフックはGoogle Mapsの状態（マップインスタンス、読み込み状態）を一元管理します。
 * マップコンポーネントからは単一のコールバック関数を通じて状態を更新します。
 *
 * @returns {Object} 以下のプロパティとメソッドを含むオブジェクト:
 *   @property {boolean} isMapLoaded - マップが読み込まれているかどうかを示すフラグ
 *   @property {google.maps.Map | null} mapInstance - 初期化されたGoogle Mapsインスタンス、または未読み込み時はnull
 *   @property {function} handleMapLoad - マップ読み込み完了時に呼び出されるコールバック関数
 *
 * @example
 * // コンポーネント内での使用例
 * function MapComponent() {
 *   const { isMapLoaded, mapInstance, handleMapLoad } = useMapState();
 *
 *   return (
 *     <div>
 *       <GoogleMap
 *         onLoad={handleMapLoad}
 *         // その他のマッププロパティ
 *       />
 *       {isMapLoaded && <p>マップが読み込まれました</p>}
 *       {mapInstance && <ChildComponent map={mapInstance} />}
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - このフックは内部でuseStateとuseCallbackを使用して状態管理と最適化を行っています
 * - Google Maps APIが正しく読み込まれていることを前提としています
 * - 通常はuseEffectと組み合わせて、マップインスタンスに基づいた副作用を実装します
 */
export const useMapState = () => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  // isLoadingステートを追加
  const [isLoading, setIsLoading] = useState(true);

  /**
   * マップが読み込まれたときのハンドラー
   * マップインスタンスを保存し、読み込み完了状態をセットします
   */
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    setIsMapLoaded(true);
    setIsLoading(false); // マップ読み込み完了時に読み込み状態を終了
  }, []);

  return { isMapLoaded, isLoading, mapInstance, handleMapLoad };
};
