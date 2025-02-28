// useLocationWarning.ts - 現在地と警告の総合管理
import { useState } from 'react';
import { useGeolocation } from './useGeolocation';
import type { LatLngLiteral } from '../utils/types';

/**
 * 現在地の取得・管理と関連警告表示を統合管理するカスタムフック
 *
 * このフックはユーザーの現在地情報を取得し、位置情報へのアクセス状態と警告表示を
 * 統合的に管理します。内部でuseGeolocationフックを使用して位置情報APIとやり取りし、
 * 現在地の表示/非表示の切り替えと、それに伴う状態管理を行います。
 *
 * ユーザーが現在地を表示したい場合に適切な警告を表示し、エラー発生時にはエラー状態も
 * 管理します。マップベースのアプリケーションで現在地機能を実装する際に特に有用です。
 *
 * @returns {Object} 以下のプロパティとメソッドを含むオブジェクト:
 *   @property {LatLngLiteral | null} currentLocation - 現在のユーザー位置。位置情報が取得できていない場合はnull。
 *   @property {string | null} locationError - 位置情報取得時のエラーメッセージ。エラーがない場合はnull。
 *   @property {boolean} showWarning - 位置情報関連の警告表示状態。trueの場合、警告を表示する。
 *   @property {function} setShowWarning - 警告表示状態を直接設定する関数。引数としてbooleanを受け取る。
 *   @property {function} handleCurrentLocationChange - 現在地追跡の有効/無効を切り替える関数。
 *                                                     引数としてbooleanを受け取り、trueで位置情報の取得を開始、
 *                                                     falseで位置情報の追跡を停止し、関連状態をリセットする。
 *
 * @example
 * // コンポーネント内での使用例
 * function LocationControl() {
 *   const {
 *     currentLocation,
 *     locationError,
 *     showWarning,
 *     setShowWarning,
 *     handleCurrentLocationChange
 *   } = useLocationWarning();
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           onChange={(e) => handleCurrentLocationChange(e.target.checked)}
 *         />
 *         現在地を表示
 *       </label>
 *
 *       {locationError && <p className="error">{locationError}</p>}
 *
 *       {showWarning && (
 *         <div className="warning">
 *           <p>現在地を表示しています</p>
 *           <button onClick={() => setShowWarning(false)}>閉じる</button>
 *         </div>
 *       )}
 *
 *       {currentLocation && (
 *         <p>
 *           現在位置: 緯度 {currentLocation.lat}, 経度 {currentLocation.lng}
 *         </p>
 *       )}
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - このフックは内部でuseGeolocationを使用してブラウザのGeolocation APIにアクセスします
 * - 位置情報へのアクセス許可がない場合、locationErrorにエラーメッセージが設定されます
 * - 位置情報の取得に成功すると自動的に警告メッセージ(showWarning)が表示されます
 * - 現在地の追跡をオフにすると、currentLocation、showWarning、locationErrorの全状態がリセットされます
 * - プライバシー上の理由から、位置情報表示時には適切な警告を表示することが推奨されます
 * - このフックはuseGeolocationと密接に連携しており、位置情報の取得ロジックをカプセル化します
 */
export const useLocationWarning = () => {
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const { getCurrentPosition } = useGeolocation();

  const handleCurrentLocationChange = (isChecked: boolean) => {
    if (isChecked) {
      getCurrentPosition({
        onSuccess: (location) => {
          setCurrentLocation(location);
          setShowWarning(true);
          setLocationError(null);
        },
        onError: (errorMessage) => {
          setLocationError(errorMessage);
          setCurrentLocation(null);
        },
      });
    } else {
      setCurrentLocation(null);
      setShowWarning(false);
      setLocationError(null);
    }
  };

  return {
    currentLocation,
    locationError,
    showWarning,
    setShowWarning,
    handleCurrentLocationChange,
  };
};
