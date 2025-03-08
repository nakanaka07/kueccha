/*
 * 機能: POIモジュールのエントリーポイント
 * 依存関係:
 *   - POI関連コンポーネント (Marker, InfoWindow)
 *   - POI管理用フック (usePoiState, useCombinedPois, useCurrentLocationPoi)
 * 注意点:
 *   - このファイルはPOIモジュールの公開APIを定義します
 *   - 外部からはここでエクスポートされた要素のみアクセス可能です
 */

export { default as Marker } from './components/Marker';
export { default as InfoWindow } from './components/InfoWindowContainer';

export { usePoiState } from './hooks/usePoiState';
export { useCombinedPois, createCurrentLocationPoi } from './hooks/useCombinedPois';
export { useCurrentLocationPoi } from './hooks/useCurrentLocationPoi';
