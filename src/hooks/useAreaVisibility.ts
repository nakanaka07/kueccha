import { useState } from 'react';
import { INITIAL_VISIBILITY } from '../utils/constants';
import type { AreaType } from '../utils/types';

/**
 * エリアの表示/非表示状態を管理するカスタムフック
 *
 * このフックは地図上の異なるエリアタイプの表示/非表示状態を管理し、
 * UIコンポーネントがユーザーの設定に基づいてエリアの可視性を制御できるようにします。
 * INITIAL_VISIBILITYで定義された初期状態から始まり、ユーザーのインタラクションに応じて
 * 状態を更新する機能を提供します。
 *
 * @returns {Object} 以下のプロパティとメソッドを含むオブジェクト:
 *   @property {Record<AreaType, boolean>} areaVisibility - 各エリアタイプ(AreaType)の表示状態をマッピングしたオブジェクト。
 *                                                         trueは表示、falseは非表示を意味します。
 *   @property {function} setAreaVisibility - エリアの表示状態を更新するための関数。
 *                                          新しい状態全体または部分的な更新を渡して状態を変更します。
 *
 * @example
 * // コンポーネント内での使用例
 * function AreaControlPanel() {
 *   const { areaVisibility, setAreaVisibility } = useAreaVisibility();
 *
 *   const toggleAreaVisibility = (areaType: AreaType) => {
 *     setAreaVisibility(prev => ({
 *       ...prev,
 *       [areaType]: !prev[areaType]
 *     }));
 *   };
 *
 *   return (
 *     <div>
 *       <h3>エリア表示設定</h3>
 *       {Object.entries(areaVisibility).map(([areaType, isVisible]) => (
 *         <label key={areaType}>
 *           <input
 *             type="checkbox"
 *             checked={isVisible}
 *             onChange={() => toggleAreaVisibility(areaType as AreaType)}
 *           />
 *           {areaType}を表示
 *         </label>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - このフックは内部でuseStateを使用して状態管理を行っています
 * - 初期表示状態はINITIAL_VISIBILITY定数から取得されます
 * - AreaType型は各エリアタイプを表す列挙型またはユニオン型であることを前提としています
 * - 一般的に他のマップ関連フックと組み合わせて使用されることを想定しています
 * - 大量のエリアタイプがある場合は、パフォーマンスを考慮して実装を最適化する必要があるかもしれません
 */
export const useAreaVisibility = () => {
  const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  return { areaVisibility, setAreaVisibility };
};
