/**
 * 機能: アプリケーション全体のローディング状態を管理するReactコンテキスト
 * 依存関係:
 *   - React (createContext, useContext, useState, useCallback, useEffect)
 *   - ../../constants/ui からのLOADING_DELAY
 * 注意点:
 *   - 複数のコンポーネントのロード状態を追跡
 *   - すべてのコンポーネントがロード完了すると自動的にフェードアウト処理を実行
 *   - キーごとにロード状態と完了状態を個別に管理
 *   - フェードアウト時間はpropsで設定可能（デフォルトはLOADING_DELAY）
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LOADING_DELAY } from '../../constants/ui';

interface LoadingState {
  isVisible: boolean;
  isFading: boolean;
  loadingStates: Record<string, boolean>;
  loadedStates: Record<string, boolean>;
}

interface LoadingContextType {
  state: LoadingState;
  registerLoading: (key: string, isLoading: boolean) => void;
  registerLoaded: (key: string, isLoaded: boolean) => void;
  isAnyLoading: boolean;
  areAllLoaded: boolean;
}

export const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider: React.FC<{
  children: React.ReactNode;
  fadeDuration?: number;
}> = ({ children, fadeDuration = LOADING_DELAY }) => {
  const [state, setState] = useState<LoadingState>({
    isVisible: true,
    isFading: false,
    loadingStates: {},
    loadedStates: {},
  });

  const registerLoading = useCallback((key: string, isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [key]: isLoading,
      },
    }));
  }, []);

  const registerLoaded = useCallback((key: string, isLoaded: boolean) => {
    setState((prev) => ({
      ...prev,
      loadedStates: {
        ...prev.loadedStates,
        [key]: isLoaded,
      },
    }));
  }, []);

  const isAnyLoading = Object.values(state.loadingStates).some(Boolean);

  const areAllLoaded = Object.values(state.loadedStates).every(Boolean) && Object.keys(state.loadedStates).length > 0;

  useEffect(() => {
    if (!isAnyLoading && areAllLoaded) {
      setState((prev) => ({ ...prev, isFading: true }));

      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, isVisible: false, isFading: false }));
      }, fadeDuration);

      return () => clearTimeout(timer);
    } else {
      setState((prev) => ({ ...prev, isVisible: true, isFading: false }));
    }
  }, [isAnyLoading, areAllLoaded, fadeDuration]);

  return (
    <LoadingContext.Provider
      value={{
        state,
        registerLoading,
        registerLoaded,
        isAnyLoading,
        areAllLoaded,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};
