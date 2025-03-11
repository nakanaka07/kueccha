import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { CONFIG } from '../constants/config';
import { ERROR_MESSAGES } from '../constants/messages';
import type { LatLngLiteral, AppError } from '../types/common';

interface MapState {
  isMapLoaded: boolean;
  isLoading: boolean;
  mapInstance: google.maps.Map | null;
  center: LatLngLiteral;
  zoom: number;
  error: AppError | null;
}

type MapAction =
  | { type: 'SET_MAP_INSTANCE'; payload: google.maps.Map }
  | { type: 'SET_MAP_LOADED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'SET_CENTER'; payload: LatLngLiteral }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'RESET_VIEW' };

const initialMapState: MapState = {
  isMapLoaded: false,
  isLoading: true,
  mapInstance: null,
  center: CONFIG.maps.defaultCenter,
  zoom: CONFIG.maps.defaultZoom,
  error: null,
};

const mapReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'SET_MAP_INSTANCE':
      return { ...state, mapInstance: action.payload };
    case 'SET_MAP_LOADED':
      return { ...state, isMapLoaded: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CENTER':
      return { ...state, center: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };
    case 'RESET_VIEW':
      return {
        ...state,
        center: CONFIG.maps.defaultCenter,
        zoom: CONFIG.maps.defaultZoom,
      };
    default:
      return state;
  }
};

interface MapContextType {
  state: MapState;
  handleMapLoad: (map: google.maps.Map) => void;
  setCenter: (center: LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  resetView: () => void;
  retryMapLoad: () => void;
}

export const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, initialMapState);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    try {
      dispatch({ type: 'SET_MAP_INSTANCE', payload: map });
      dispatch({ type: 'SET_MAP_LOADED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: ERROR_MESSAGES.MAP.LOAD_FAILED,
          details: errorMessage,
        },
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setCenter = useCallback((center: LatLngLiteral) => {
    dispatch({ type: 'SET_CENTER', payload: center });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);

  const resetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });

    if (state.mapInstance) {
      state.mapInstance.setCenter(CONFIG.maps.defaultCenter);
      state.mapInstance.setZoom(CONFIG.maps.defaultZoom);
    }
  }, [state.mapInstance]);

  const retryMapLoad = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });

    if (state.mapInstance) {
      handleMapLoad(state.mapInstance);
    } else {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: ERROR_MESSAGES.MAP.LOAD_FAILED,
          code: 'MAP_INSTANCE_MISSING',
        },
      });
    }
  }, [state.mapInstance, handleMapLoad]);

  useEffect(() => {
    if (state.mapInstance && state.isMapLoaded) {
      state.mapInstance.setCenter(state.center);
      state.mapInstance.setZoom(state.zoom);
    }
  }, [state.mapInstance, state.isMapLoaded, state.center, state.zoom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.isLoading && !state.isMapLoaded) {
        dispatch({
          type: 'SET_ERROR',
          payload: {
            message: ERROR_MESSAGES.MAP.LOAD_FAILED,
            details: ERROR_MESSAGES.MAP.RETRY_MESSAGE,
          },
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 20000);

    return () => clearTimeout(timer);
  }, [state.isLoading, state.isMapLoaded]);

  return (
    <MapContext.Provider
      value={{
        state,
        handleMapLoad,
        setCenter,
        setZoom,
        resetView,
        retryMapLoad,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
