import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { ERROR_MESSAGES } from '../constants/messages';
import { useAreaFiltering } from '../hooks/useAreaFiltering';
import { createError } from '../utils/errorHandling';
import type { AreaType } from '../types/common';
import type { AppError } from '../types/common';
import type { Poi } from '../types/poi';

interface PoiState {
  pois: Poi[];
  filteredPois: Poi[];
  selectedPoi: Poi | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: AppError | null; // ErrorからAppErrorに変更
  showCurrentLocation: boolean;
}

type PoiAction =
  | { type: 'SET_POIS'; payload: Poi[] }
  | { type: 'SET_FILTERED_POIS'; payload: Poi[] }
  | { type: 'SET_SELECTED_POI'; payload: Poi | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'SET_SHOW_CURRENT_LOCATION'; payload: boolean };

const initialPoiState: PoiState = {
  pois: [],
  filteredPois: [],
  selectedPoi: null,
  isLoading: true,
  isLoaded: false,
  error: null,
  showCurrentLocation: false,
};

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

interface PoiContextType {
  state: PoiState;
  setSelectedPoi: (poi: Poi | null) => void;
  filterPois: (areaVisibility: Record<AreaType, boolean>) => void;
  clearSelectedPoi: () => void;
  setShowCurrentLocation: (show: boolean) => void;
}

export const PoiContext = createContext<PoiContextType | null>(null);

export const PoiProvider: React.FC<{
  children: React.ReactNode;
  initialPois: Poi[];
}> = ({ children, initialPois }) => {
  const [state, dispatch] = useReducer(poiReducer, {
    ...initialPoiState,
    pois: initialPois,
    filteredPois: initialPois,
  });

  const { filteredPois } = useAreaFiltering(state.pois);

  useEffect(() => {
    try {
      if (Array.isArray(initialPois)) {
        if (initialPois.length > 0) {
          dispatch({ type: 'SET_POIS', payload: initialPois });
          dispatch({ type: 'SET_FILTERED_POIS', payload: initialPois });
          dispatch({ type: 'SET_LOADED', payload: true });
          dispatch({ type: 'SET_LOADING', payload: false });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        throw new Error(ERROR_MESSAGES.DATA.LOADING_FAILED);
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? createError('DATA', 'LOADING_FAILED', err.message)
          : createError('DATA', 'LOADING_FAILED', String(err));
      dispatch({ type: 'SET_ERROR', payload: error });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [initialPois]);

  useEffect(() => {
    dispatch({ type: 'SET_FILTERED_POIS', payload: filteredPois });
  }, [filteredPois]);

  const setSelectedPoi = useCallback((poi: Poi | null) => {
    dispatch({ type: 'SET_SELECTED_POI', payload: poi });
  }, []);

  const filterPois = useCallback((areaVisibility: Record<AreaType, boolean>) => {
    console.warn('PoiContext.filterPois は非推奨です。useAreaFiltering を使用してください');
    // 実際のフィルタリングはuseAreaFilteringが行う
  }, []);

  const clearSelectedPoi = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_POI', payload: null });
  }, []);

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

export const usePoiContext = () => {
  const context = useContext(PoiContext);
  if (!context) {
    throw new Error('usePoiContext must be used within a PoiProvider');
  }
  return context;
};
