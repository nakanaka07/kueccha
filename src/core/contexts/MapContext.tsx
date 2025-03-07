import React, { createContext, useContext, useCallback, useState, useReducer, useEffect } from 'react';
import { CONFIG } from '../../constants/config';
import { ERROR_MESSAGES } from '../../constants/messages';
import type { LatLngLiteral, AppError } from '../../types/common';

// 状態の型定義
interface MapState {
  isMapLoaded: boolean;
  isLoading: boolean;
  mapInstance: google.maps.Map | null;
  center: LatLngLiteral;
  zoom: number;
  error: AppError | null;
}

// アクションの型定義
type MapAction =
  | { type: 'SET_MAP_INSTANCE'; payload: google.maps.Map }
  | { type: 'SET_MAP_LOADED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'SET_CENTER'; payload: LatLngLiteral }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'RESET_VIEW' };

// 初期状態
const initialMapState: MapState = {
  isMapLoaded: false,
  isLoading: true,
  mapInstance: null,
  center: CONFIG.maps.defaultCenter,
  zoom: CONFIG.maps.defaultZoom,
  error: null,
};

// リデューサー関数
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

// コンテキストの型定義
interface MapContextType {
  state: MapState;
  handleMapLoad: (map: google.maps.Map) => void;
  setCenter: (center: LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  resetView: () => void;
  retryMapLoad: () => void;
}

// コンテキストの作成
export const MapContext = createContext<MapContextType | null>(null);

// コンテキストプロバイダーコンポーネント
export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, initialMapState);

  // マップロード処理
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

  // 中心座標の設定
  const setCenter = useCallback((center: LatLngLiteral) => {
    dispatch({ type: 'SET_CENTER', payload: center });
  }, []);

  // ズームレベルの設定
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);

  // 表示のリセット
  const resetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });

    // マップインスタンスが存在する場合は直接更新
    if (state.mapInstance) {
      state.mapInstance.setCenter(CONFIG.maps.defaultCenter);
      state.mapInstance.setZoom(CONFIG.maps.defaultZoom);
    }
  }, [state.mapInstance]);

  // マップロードの再試行
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

  // マップインスタンスが変更されたときに中心とズームを適用
  useEffect(() => {
    if (state.mapInstance && state.isMapLoaded) {
      state.mapInstance.setCenter(state.center);
      state.mapInstance.setZoom(state.zoom);
    }
  }, [state.mapInstance, state.isMapLoaded, state.center, state.zoom]);

  // タイムアウト処理
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
    }, 20000); // 20秒のタイムアウト

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

// フック
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
