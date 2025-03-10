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
