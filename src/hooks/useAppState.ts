import { useAreaVisibility } from './useAreaVisibility';
import { useLocationWarning } from './useLocationWarning';
import { useMapState } from './useMapState';
import { usePoiState } from './usePoiState';
import type { Poi } from '../utils/types';

/**
 * アプリケーションの主要な状態管理を統合するカスタムフック
 *
 * このフックは複数の特化したフック（地図、POI、エリア表示、位置情報警告）を組み合わせ、
 * アプリケーション全体の状態管理を一元化します。これにより、コンポーネントは単一の
 * フックから必要な状態と操作関数をすべて取得できます。
 *
 * @template Poi - POI（Point of Interest）の型定義
 * @param {Poi[]} pois - 表示対象のPOI（Point of Interest）の配列。地図上に表示する場所や施設などのデータ。
 *
 * @returns {Object} 以下のプロパティを含むオブジェクト：
 *   - mapRef: 地図コンポーネントへの参照
 *   - mapInstance: 初期化された地図インスタンス
 *   - mapCenter: 地図の中心座標
 *   - mapZoom: 地図のズームレベル
 *   - filteredPois: フィルタリング済みのPOI配列
 *   - searchResults: 検索結果のPOI配列
 *   - selectedPoi: 現在選択中のPOI
 *   - searchTerm: 現在の検索語句
 *   - areaVisibility: エリアの表示状態を制御するオブジェクト
 *   - setAreaVisibility: エリア表示状態を更新する関数
 *   - locationPermission: 位置情報の許可状態
 *   - locationError: 位置情報の取得エラー
 *   - actions: アクションをグループ化したオブジェクト
 *     - handleMapLoad: 地図読み込み完了時のハンドラ
 *     - handleSearchResultClick: 検索結果クリック時のハンドラ
 *     - setSelectedPoi: POI選択を設定するハンドラ
 *
 * @example
 * // アプリケーションコンポーネントでの使用例
 * function AppComponent() {
 *   const poiData = useFetchPoiData(); // POIデータを取得する別のフック
 *   const {
 *     mapRef,
 *     selectedPoi,
 *     searchResults,
 *     searchTerm,
 *     actions
 *   } = useAppState(poiData);
 *
 *   return (
 *     <div>
 *       <SearchBar
 *         value={searchTerm}
 *         results={searchResults}
 *         onResultClick={actions.handleSearchResultClick}
 *       />
 *       <Map
 *         ref={mapRef}
 *         onLoad={actions.handleMapLoad}
 *         selectedPoi={selectedPoi}
 *       />
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - このフックは複数の特化したフックを統合していますが、内部実装の詳細はそれぞれのフックに委譲します
 * - 返されるアクションオブジェクトには、UI操作に関連する主要な関数がグループ化されています
 * - 大規模なアプリケーションでは、このフックをコンテキストプロバイダーと組み合わせて使用すると効果的です
 * - パフォーマンス最適化のため、不要な再レンダリングを避けるようにメモ化を検討してください
 */
export const useAppState = (pois: Poi[]) => {
  const mapState = useMapState();
  const poiState = usePoiState(pois);
  const { areaVisibility, setAreaVisibility } = useAreaVisibility();
  const locationWarning = useLocationWarning();

  return {
    ...mapState,
    ...poiState,
    areaVisibility,
    setAreaVisibility,
    ...locationWarning,
    actions: {
      handleMapLoad: mapState.handleMapLoad,
      handleSearchResultClick: poiState.handleSearchResultClick,
      setSelectedPoi: poiState.setSelectedPoi,
    },
  };
};
