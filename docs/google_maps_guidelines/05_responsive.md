# 5. レスポンシブマップ設計

## デバイス検出と設定の自動切り替え

```typescript
// デバイスタイプに応じたマップオプションの自動選択
export const getResponsiveMapOptions = (): google.maps.MapOptions => {
  return logger.measureTime(
    'レスポンシブマップオプションの決定',
    () => {
      const isMobile = isMobileDevice();
      logger.debug('デバイスタイプに基づくマップオプションを選択', {
        isMobileDevice: isMobile,
        selectedOption: isMobile ? 'MOBILE_MAP_OPTIONS' : 'DEFAULT_MAP_OPTIONS',
      });

      return isMobile ? MOBILE_MAP_OPTIONS : DEFAULT_MAP_OPTIONS;
    },
    LogLevel.DEBUG
  );
};

// モバイルデバイス検出
function isMobileDevice(): boolean {
  const windowWidth = window.innerWidth;
  const DEVICE_BREAKPOINT = 768; // タブレット/モバイルの境界
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return windowWidth <= DEVICE_BREAKPOINT || hasTouchSupport;
}
```

## モバイル向け最適化マップコントロール

```typescript
// モバイル向けマップオプション
export const MOBILE_MAP_OPTIONS = {
  zoom: 9, // モバイルは広めの表示から
  mapTypeControl: false, // 余計な操作を減らす
  streetViewControl: false, // 画面を広く使う
  zoomControlOptions: {
    position: google.maps.ControlPosition.RIGHT_CENTER, // 片手操作しやすい位置
  },
  fullscreenControlOptions: {
    position: google.maps.ControlPosition.TOP_RIGHT,
  },
  gestureHandling: 'greedy', // モバイルでのマップ操作を優先
};
```

## 表示サイズと読み込み戦略

- **表示領域に応じた読み込み**: 地図の表示範囲内にあるマーカーのみを描画
- **モバイル向けアセット最適化**: 小さいマーカーアイコン、低解像度マップタイル
- **レスポンシブUIコンポーネント**: 画面サイズに応じてフィルターやコントロールの表示を調整

```typescript
// 表示領域内のマーカーのみを描画する例
function updateVisibleMarkers(map: google.maps.Map, allMarkers: Array<google.maps.marker.AdvancedMarkerElement>) {
  const bounds = map.getBounds();
  if (!bounds) return;
  
  allMarkers.forEach(marker => {
    const position = marker.position;
    if (position && bounds.contains(position)) {
      marker.map = map;
    } else {
      marker.map = null; // 表示範囲外のマーカーは非表示に
    }
  });
}

// 地図の移動が終わった時にマーカー表示を更新
map.addListener('idle', () => {
  updateVisibleMarkers(map, allMarkers);
});
```
