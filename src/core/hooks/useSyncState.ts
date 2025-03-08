/**
 * 機能: グローバル状態とローカル状態を双方向に同期するカスタムフック
 * 依存関係:
 *   - React hooks (useState, useEffect, useRef)
 *   - React 16.8以上 (フックをサポートするバージョン)
 * 注意点:
 *   - 循環参照の可能性があるため、isEqualオプションで適切な比較関数を指定する
 *   - デバッグモードで同期の流れを確認可能
 *   - 同期方向を一方向に制限することも可能
 *   - パフォーマンス考慮: 複雑なオブジェクトの場合はカスタム比較関数を実装すべき
 */
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

export function useSyncState<T>(
  globalState: T,
  setGlobalState: Dispatch<SetStateAction<T>>,
  options?: {
    isEqual?: (a: T, b: T) => boolean;
    debug?: boolean;
    disableGlobalToLocal?: boolean;
    disableLocalToGlobal?: boolean;
  },
): [T, Dispatch<SetStateAction<T>>] {
  const [localState, setLocalState] = useState<T>(globalState);
  const syncingRef = useRef<boolean>(false);
  const prevGlobalRef = useRef<T>(globalState);
  const prevLocalRef = useRef<T>(localState);

  const {
    isEqual = (a: T, b: T): boolean => a === b,
    debug = false,
    disableGlobalToLocal = false,
    disableLocalToGlobal = false,
  } = options || {};

  useEffect(() => {
    if (disableGlobalToLocal) return;

    if (!syncingRef.current && !isEqual(globalState, prevLocalRef.current)) {
      if (debug) {
        console.log('[useSyncState] グローバル→ローカルの同期:', {
          グローバル: globalState,
          ローカル: prevLocalRef.current,
        });
      }

      try {
        syncingRef.current = true;
        prevGlobalRef.current = globalState;
        setLocalState(globalState);
        prevLocalRef.current = globalState;
      } finally {
        syncingRef.current = false;
      }
    }
  }, [globalState, isEqual, debug, disableGlobalToLocal]);

  useEffect(() => {
    if (disableLocalToGlobal) return;

    if (!syncingRef.current && !isEqual(localState, prevGlobalRef.current)) {
      if (debug) {
        console.log('[useSyncState] ローカル→グローバルの同期:', {
          ローカル: localState,
          グローバル: prevGlobalRef.current,
        });
      }

      try {
        syncingRef.current = true;
        prevLocalRef.current = localState;
        setGlobalState(localState);
        prevGlobalRef.current = localState;
      } finally {
        syncingRef.current = false;
      }
    }
  }, [localState, setGlobalState, isEqual, debug, disableLocalToGlobal]);

  return [localState, setLocalState];
}
