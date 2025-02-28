import { useState, useEffect } from 'react';

/**
 * グローバルステートとローカルステートを双方向に同期するカスタムフック
 *
 * このフックは、コンポーネント内のローカルステートと外部のグローバルステート（Contextや状態管理ライブラリなど）を
 * 常に同期させるために使用します。どちらか一方が更新されると、もう一方も自動的に更新されます。
 * これにより、コンポーネント内で状態を簡単に操作しながらも、グローバルな状態との一貫性を保つことができます。
 *
 * @template T ステートの型
 * @param {T} globalState - 外部から提供されるグローバルステート（Context、Redux、Zustandなどの状態）
 * @param {(state: T) => void} setGlobalState - グローバルステートを更新するための関数
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} [localState, setLocalState] - useState hookと同じ形式で返されるタプル
 *   - localState: ローカルコンポーネント内で使用する状態値
 *   - setLocalState: ローカル状態を更新する関数（これを使用するとグローバル状態も自動的に更新される）
 *
 * @example
 * // Context APIと組み合わせた使用例
 * function UserProfile({ user, updateUser }) {
 *   // グローバル状態とローカル状態を同期
 *   const [profile, setProfile] = useSyncState(user, updateUser);
 *
 *   const handleNameChange = (e) => {
 *     setProfile({ ...profile, name: e.target.value });
 *     // この変更は自動的にグローバル状態にも反映される
 *   };
 *
 *   return (
 *     <div>
 *       <input value={profile.name} onChange={handleNameChange} />
 *       <p>現在の名前: {profile.name}</p>
 *     </div>
 *   );
 * }
 *
 * @example
 * // 親コンポーネントから渡されるpropsとの同期例
 * function EditableCounter({ count, onCountChange }) {
 *   const [localCount, setLocalCount] = useSyncState(count, onCountChange);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setLocalCount(localCount - 1)}>-</button>
 *       <span>{localCount}</span>
 *       <button onClick={() => setLocalCount(localCount + 1)}>+</button>
 *     </div>
 *   );
 * }
 *
 * @remarks
 * - このフックは双方向のデータバインディングを提供します
 * - 内部で2つのuseEffectを使用して両方向の同期を実現しています：
 *   1. ローカル → グローバル：ローカルステート変更時にグローバルステートを更新
 *   2. グローバル → ローカル：グローバルステート変更時にローカルステートを更新
 * - 無限ループを避けるため、useEffectの依存配列に適切に依存関係を設定しています
 * - パフォーマンス最適化のため、setGlobalState関数はuseCallbackでメモ化することを推奨します
 * - このフックは親コンポーネントからpropsとして渡されるステート用に特に有用です
 * - 注意: このフックを使用する際は、パフォーマンスへの影響を考慮してください（頻繁に更新される値の場合）
 * - オブジェクトや配列を状態として使用する場合は、参照の一貫性に注意が必要です
 */
export const useSyncState = <T>(globalState: T, setGlobalState: (state: T) => void) => {
  // ローカルステートをグローバルステートで初期化
  const [localState, setLocalState] = useState(globalState);

  // ローカルステートが変更されたらグローバルステートを更新
  useEffect(() => {
    setGlobalState(localState);
  }, [localState, setGlobalState]);

  // グローバルステートが変更されたらローカルステートを更新
  useEffect(() => {
    setLocalState(globalState);
  }, [globalState]);

  return [localState, setLocalState] as const;
};
