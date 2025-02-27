import { useState, useEffect } from 'react';

export const useSyncState = <T>(globalState: T, setGlobalState: (state: T) => void) => {
  const [localState, setLocalState] = useState(globalState);

  useEffect(() => {
    setGlobalState(localState);
  }, [localState, setGlobalState]);

  useEffect(() => {
    setLocalState(globalState);
  }, [globalState]);

  return [localState, setLocalState] as const;
};
