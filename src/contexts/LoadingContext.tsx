import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { LOADING_DELAY } from '../constants/ui';

// 状態の型定義
interface LoadingState {
  isVisible: boolean;
  isFading: boolean;
  loadingStates: Record<string, boolean>;
  loadedStates: Record<string, boolean>;
}

// コンテキストの型定義
interface LoadingContextType {
  state: LoadingState;
  registerLoading: (key: string, isLoading: boolean) => void;
  registerLoaded: (key: string, isLoaded: boolean) => void;
  isAnyLoading: boolean;
  areAllLoaded: boolean;
}

// コンテキストの作成
export const LoadingContext = createContext<LoadingContextType | null>(null);

// コンテキストプロバイダーコンポーネント
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

  // 任意のキーでローディング状態を登録する
  const registerLoading = useCallback((key: string, isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [key]: isLoading
      }
    }));
  }, []);

  // 任意のキーでロード完了状態を登録する
  const registerLoaded = useCallback((key: string, isLoaded: boolean) => {
    setState(prev => ({
      ...prev,
      loadedStates: {
        ...prev.loadedStates,
        [key]: isLoaded
      }
    }));
  }, []);

  // いずれかのコンポーネントがロード中かどうか
  const isAnyLoading = Object.values(state.loadingStates).some(Boolean);

  // すべてのコンポーネントがロード完了したかどうか
  const areAllLoaded = Object.values(state.loadedStates).every(Boolean) &&
                     Object.keys(state.loadedStates).length > 0;

  // ロード状態に応じてフェードアウト処理を行う
  useEffect(() => {
    if (!isAnyLoading && areAllLoaded) {
      setState(prev => ({ ...prev, isFading: true }));

      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, isVisible: false, isFading: false }));
      }, fadeDuration);

      return () => clearTimeout(timer);
    } else {
      setState(prev => ({ ...prev, isVisible: true, isFading: false }));
    }
  }, [isAnyLoading, areAllLoaded, fadeDuration]);

  return (
    <LoadingContext.Provider value={{
      state,
      registerLoading,
      registerLoaded,
      isAnyLoading,
      areAllLoaded,
    }}>
      {children}
    </LoadingContext.Provider>
  );
};

// フック
export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};