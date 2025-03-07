import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

/**
 * グローバル状態とローカル状態を同期させるためのカスタムフック
 *
 * @template T - 状態の型
 * @param globalState - 同期元となるグローバルな状態
 * @param setGlobalState - グローバルな状態を更新するための関数
 * @param options - 動作オプション
 * @returns [localState, setLocalState] - ローカル状態と更新関数のタプル
 */
export function useSyncState<T>(
  globalState: T,
  setGlobalState: Dispatch<SetStateAction<T>>,
  options?: {
    /**
     * 状態を比較するためのカスタム関数
     * デフォルトでは参照の比較を行います
     */
    isEqual?: (a: T, b: T) => boolean;
    /**
     * デバッグモード (コンソールにログを出力)
     */
    debug?: boolean;
    /**
     * グローバル→ローカルの同期を無効にする
     */
    disableGlobalToLocal?: boolean;
    /**
     * ローカル→グローバルの同期を無効にする
     */
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

  // グローバル→ローカルの同期
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

  // ローカル→グローバルの同期
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
