import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { CURRENT_LOCATION_POI } from '../../../constants/areas';
import { ERROR_MESSAGES } from '../../../constants/messages';
import type { Poi, AreaType } from '../../../types/common';

// 状態の型定義
interface PoiState {
  pois: Poi[];
  filteredPois: Poi[];
  selectedPoi: Poi | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  showCurrentLocation: boolean;
}

// アクションの型定義
type PoiAction =
  | { type: 'SET_POIS'; payload: Poi[] }
  | { type: 'SET_FILTERED_POIS'; payload: Poi[] }
  | { type: 'SET_SELECTED_POI'; payload: Poi | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_SHOW_CURRENT_LOCATION'; payload: boolean };

// 初期状態
const initialPoiState: PoiState = {
  pois: [],
  filteredPois: [],
  selectedPoi: null,
  isLoading: true,
  isLoaded: false,
  error: null,
  showCurrentLocation: false,
};

// リデューサー関数
const poiReducer = (state: PoiState, action: PoiAction): PoiState => {
  switch (action.type) {
    case 'SET_POIS':
      return { ...state, pois: action.payload };
    case 'SET_FILTERED_POIS':
      return { ...state, filteredPois: action.payload };
    case 'SET_SELECTED_POI':
      return { ...state, selectedPoi: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOADED':
      return { ...state, isLoaded: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SHOW_CURRENT_LOCATION':
      return { ...state, showCurrentLocation: action.payload };
    default:
      return state;
  }
};

// コンテキストの型定義
interface PoiContextType {
  state: PoiState;
  setSelectedPoi: (poi: Poi | null) => void;
  filterPois: (areaVisibility: Record<AreaType, boolean>) => void;
  clearSelectedPoi: () => void;
  setShowCurrentLocation: (show: boolean) => void;
}

// コンテキストの作成
export const PoiContext = createContext<PoiContextType | null>(null);

// コンテキストプロバイダーコンポーネント
export const PoiProvider: React.FC<{
  children: React.ReactNode;
  initialPois: Poi[];
}> = ({ children, initialPois }) => {
  const [state, dispatch] = useReducer(poiReducer, {
    ...initialPoiState,
    pois: initialPois,
    filteredPois: initialPois,
  });

  // POIデータの読み込み状態を監視
  useEffect(() => {
    try {
      if (Array.isArray(initialPois)) {
        if (initialPois.length > 0) {
          dispatch({ type: 'SET_POIS', payload: initialPois });
          dispatch({ type: 'SET_FILTERED_POIS', payload: initialPois });
          dispatch({ type: 'SET_LOADED', payload: true });
          dispatch({ type: 'SET_LOADING', payload: false });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false }); // データは空だが読み込みは完了
        }
      } else {
        throw new Error(ERROR_MESSAGES.DATA.LOADING_FAILED);
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err : new Error(String(err)) });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [initialPois]);

  // POIを選択する
  const setSelectedPoi = useCallback((poi: Poi | null) => {
    dispatch({ type: 'SET_SELECTED_POI', payload: poi });
  }, []);

  // POIのフィルタリング
  const filterPois = useCallback(
    (areaVisibility: Record<AreaType, boolean>) => {
      const filtered = state.pois.filter((poi) => {
        if (!poi.area) return true;
        return areaVisibility[poi.area as AreaType];
      });

      dispatch({ type: 'SET_FILTERED_POIS', payload: filtered });
    },
    [state.pois],
  );

  // 選択解除
  const clearSelectedPoi = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_POI', payload: null });
  }, []);

  // 現在地表示設定
  const setShowCurrentLocation = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_CURRENT_LOCATION', payload: show });
  }, []);

  return (
    <PoiContext.Provider
      value={{
        state,
        setSelectedPoi,
        filterPois,
        clearSelectedPoi,
        setShowCurrentLocation,
      }}
    >
      {children}
    </PoiContext.Provider>
  );
};

// フック
export const usePoiContext = () => {
  const context = useContext(PoiContext);
  if (!context) {
    throw new Error('usePoiContext must be used within a PoiProvider');
  }
  return context;
};
