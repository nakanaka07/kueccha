import { useCallback } from 'react';

/**
 * マップを北向きにリセットする機能を提供するカスタムフック
 *
 * @param {google.maps.Map | null} map - 制御対象のGoogle Mapsインスタンス
 * @returns {Object} 北向きリセット機能を含むオブジェクト
 *   @property {function} resetNorth - マップの向きを北に設定する関数
 *
 * @example
 * function MapComponent() {
 *   const [map, setMap] = useState(null);
 *   const { resetNorth } = useMapNorthControl(map);
 *
 *   return (
 *     <>
 *       <GoogleMap onLoad={setMap}>...</GoogleMap>
 *       <button onClick={resetNorth}>北を上に</button>
 *     </>
 *   );
 * }
 *
 * @remarks
 * - このフックはGoogle Maps APIが適切に読み込まれている必要があります
 * - 地図の向きだけを制御し、他のマップ操作とは完全に分離されています
 */
export const useMapNorthControl = (map: google.maps.Map | null) => {
  const resetNorth = useCallback(() => {
    if (map) {
      map.setHeading(0);
    }
  }, [map]);

  return { resetNorth };
};
