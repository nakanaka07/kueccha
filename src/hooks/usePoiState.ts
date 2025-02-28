import { useState, useEffect, useCallback } from 'react';
import type { Poi } from '../utils/types';

/**
 * POI(Point of Interest)状態を管理するカスタムフック
 *
 * このフックはPOI（地図上の関心地点）の状態を管理し、
 * 検索結果の表示やPOI選択などの機能を提供します。
 * POIデータの読み込み状態の追跡と選択されたPOIの参照を保持します。
 *
 * @param {Poi[]} pois - 表示対象のPOI配列。地図上に表示する地点データの配列です。
 *                        各POIオブジェクトには位置情報や属性データが含まれます。
 *
 * @returns {Object} 以下のプロパティとメソッドを含むオブジェクト:
 *   @property {boolean} isLoaded - POIデータが読み込まれたかどうかを示すフラグ。
 *                                   条件付きレンダリングなどに使用できます。
 *   @property {Poi | null} selectedPoi - 現在選択されているPOI、または未選択時はnull。
 *                                        選択されたPOIの詳細表示などに使用できます。
 *   @property {function} setSelectedPoi - 選択POIを更新するStateセッター関数。
 *                                        POIを直接選択する場合に使用します。
 *   @property {function} handleSearchResultClick - 検索結果クリック時のハンドラ。
 *                                               検索結果リストなどのUIコンポーネントに渡して使用します。
 *
 * @example
 * // コンポーネント内での使用例
 * function MapWithPois({ poisData }) {
 *   const { isLoaded, selectedPoi, setSelectedPoi, handleSearchResultClick } = usePoiState(poisData);
 *
 *   return (
 *     <div>
 *       {isLoaded ? (
 *         <>
 *           <PoiList pois={poisData} onPoiClick={handleSearchResultClick} />
 *           <Map>
 *             {selectedPoi && <PoiMarker poi={selectedPoi} />}
 *           </Map>
 *           {selectedPoi && <PoiDetailPanel poi={selectedPoi} onClose={() => setSelectedPoi(null)} />}
 *         </>
 *       ) : (
 *         <LoadingSpinner />
 *       )}
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - このフックは内部でuseState、useEffect、useCallbackを使用して状態管理と最適化を行っています
 * - poisが空の配列の場合、isLoadedはfalseのままとなります
 * - 一度でもPOIデータが読み込まれると、isLoadedはtrueになります
 * - 選択したPOIに基づいた詳細情報の表示やマップの中心移動などの処理は、このフックと連携する形で実装することが想定されています
 */
export const usePoiState = (pois: Poi[]) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  const handleSearchResultClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  useEffect(() => {
    if (pois.length > 0) {
      setIsLoaded(true);
    }
  }, [pois]);

  return { isLoaded, selectedPoi, setSelectedPoi, handleSearchResultClick };
};
