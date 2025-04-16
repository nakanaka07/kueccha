# 5. レスポンシブマップ設計

## デバイス検出と設定の自動切り替え

```typescript
// デバイスタイプに応じたマップオプションの自動選択
export const getResponsiveMapOptions = (): google.maps.MapOptions => {
  return logger.measureTime(
    'レスポンシブマップオプションの決定',
    () => {
      // 2025年版：より詳細なデバイス情報の取得
      const deviceInfo = getEnhancedDeviceInfo();

      logger.debug('デバイス情報に基づくマップオプションを選択', {
        deviceType: deviceInfo.type,
        orientation: deviceInfo.orientation,
        screenSize: deviceInfo.screenSize,
        performanceProfile: deviceInfo.performanceProfile,
        selectedOption: getOptionNameForDevice(deviceInfo),
      });

      // デバイス情報に基づいて最適なオプションを選択
      return getMapOptionsForDevice(deviceInfo);
    },
    LogLevel.DEBUG
  );
};

// 2025年版：詳細なデバイス情報の取得
function getEnhancedDeviceInfo() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const hasTouchSupport =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // デバイスタイプの判別
  let type = 'desktop';
  if (width <= 768) {
    type = 'mobile';
  } else if (width <= 1024) {
    type = 'tablet';
  }

  // 画面の向き
  const orientation = width > height ? 'landscape' : 'portrait';

  // 画面サイズ分類（2025年の一般的な基準）
  let screenSize = 'medium';
  if (width <= 400) screenSize = 'small';
  else if (width >= 1440) screenSize = 'large';

  // パフォーマンスプロファイルの推測
  let performanceProfile = 'standard';

  // メモリ制約の可能性がある古いモバイルデバイス
  if (type === 'mobile' && devicePixelRatio < 2) {
    performanceProfile = 'low';
  }

  // ハイエンドデバイスの可能性
  if (devicePixelRatio >= 3 && navigator.hardwareConcurrency > 4) {
    performanceProfile = 'high';
  }

  return {
    type,
    width,
    height,
    devicePixelRatio,
    orientation,
    screenSize,
    hasTouchSupport,
    performanceProfile,
    // 将来のユーザー設定を反映できるよう拡張可能
    userPreferences: getUserMapPreferences(),
  };
}

// ユーザー設定の取得
function getUserMapPreferences() {
  // ローカルストレージから保存された設定を取得
  try {
    const savedPrefs = localStorage.getItem('mapUserPreferences');
    return savedPrefs ? JSON.parse(savedPrefs) : {};
  } catch (e) {
    return {};
  }
}

// モバイルデバイス検出
function isMobileDevice(): boolean {
  const windowWidth = window.innerWidth;
  const DEVICE_BREAKPOINT = 768; // タブレット/モバイルの境界
  const hasTouchSupport =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
function updateVisibleMarkers(
  map: google.maps.Map,
  allMarkers: Array<google.maps.marker.AdvancedMarkerElement>
) {
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
