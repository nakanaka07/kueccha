# 5. レスポンシブマップ設計

## デバイス検出と設定の自動切り替え

```typescript
// 共通設定定義
// POI（施設情報）ラベルを非表示にするスタイル設定
export const COMMON_POI_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

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
    // 静的ホスティング対応の設定を追加
    staticHostingOptimized: true,
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

// デバイス情報に基づいてオプション名を取得
function getOptionNameForDevice(deviceInfo: any): string {
  if (deviceInfo.type === 'mobile') {
    return 'mobile';
  } else if (deviceInfo.type === 'tablet') {
    return deviceInfo.orientation === 'landscape'
      ? 'tabletLandscape'
      : 'tabletPortrait';
  } else {
    // デスクトップ
    return deviceInfo.performanceProfile === 'high'
      ? 'desktopHigh'
      : 'desktopStandard';
  }
}

// デバイス情報に基づいてマップオプションを取得
function getMapOptionsForDevice(deviceInfo: any): google.maps.MapOptions {
  // モバイルデバイスの場合
  if (deviceInfo.type === 'mobile') {
    // MOBILE_MAP_OPTIONS を基本として使用
    return {
      ...MOBILE_MAP_OPTIONS,
      // 追加の設定（デバイス性能に応じた調整）
      maxZoom:
        deviceInfo.performanceProfile === 'low'
          ? 16
          : MOBILE_MAP_OPTIONS.maxZoom,
      // ユーザー設定があれば優先
      ...deviceInfo.userPreferences,
    };
  }

  // タブレットデバイスの場合
  if (deviceInfo.type === 'tablet') {
    return {
      zoom: 10,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      },
      streetViewControl: deviceInfo.orientation === 'landscape',
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      fullscreenControl: true,
      gestureHandling: 'greedy',
      // ユーザー設定があれば優先
      ...deviceInfo.userPreferences,
    };
  }

  // デスクトップ（デフォルト）の場合
  return {
    zoom: 10,
    mapTypeControl: true,
    streetViewControl: true,
    zoomControl: true,
    fullscreenControl: true,
    gestureHandling: 'auto',
    // ハイエンドデバイスの場合は高詳細設定
    tilt: deviceInfo.performanceProfile === 'high' ? 45 : 0,
    // ユーザー設定があれば優先
    ...deviceInfo.userPreferences,
  };
}

/**
 * モバイルデバイス検出用の後方互換性関数
 *
 * @deprecated 2025年版からは getEnhancedDeviceInfo().type === 'mobile' の使用を推奨します
 * この関数は既存コードとの互換性のために残されています
 * @returns モバイルデバイスの場合true
 */
function isMobileDevice(): boolean {
  const deviceInfo = getEnhancedDeviceInfo();
  return deviceInfo.type === 'mobile';
}
```

## 静的ホスティング環境のためのレスポンシブ対応

```typescript
// ビューポートのサイズ管理用インターフェース
interface ViewportSize {
  width: number;
  height: number;
}

// 静的ホスティング環境に最適化されたレスポンシブマップ設定
export function setupResponsiveBehavior(
  map: google.maps.Map,
  options: ResponsiveMapOptions = {}
): void {
  // 現在のビューポートサイズを取得して状態として保持
  let viewportSize: ViewportSize = getViewportDimensions();

  // デバイスに応じた操作性の設定
  configureInteractionForDevice(map, viewportSize.width, viewportSize.height);
  // リサイズ時の動作を最適化（デバウンス処理）
  let resizeTimeout: number | undefined;
  window.addEventListener('resize', () => {
    // サイズ変更中の過剰な再計算を防止
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    // 静的ホスティング環境ではリサイズ処理を最小限に
    resizeTimeout = window.setTimeout(() => {
      const newViewportSize = getViewportDimensions();

      // コンテナサイズの更新
      const mapContainer = document.getElementById(
        options.mapContainerId || 'map'
      );
      if (mapContainer) {
        adjustMapContainerSize(
          mapContainer,
          newViewportSize.width,
          newViewportSize.height
        );
      }

      // マップ表示領域の再調整（APIリクエスト最小化のため必要な時のみ）
      if (
        hasSignificantSizeChange(
          viewportSize.width,
          viewportSize.height,
          newViewportSize.width,
          newViewportSize.height
        )
      ) {
        map.setOptions({
          ...getOptimalMapSettings(
            newViewportSize.width,
            newViewportSize.height
          ),
        });

        // マップサイズの再計算を適用
        google.maps.event.trigger(map, 'resize');

        // 必要な場合のみ、佐渡島の重要エリアを表示領域に収める
        if (options.fitSadoIslandOnResize) {
          fitSadoIslandBounds(map);
        }
      }

      // 新しいサイズを保存
      viewportSize = newViewportSize;
    }, 250); // 250ms のデバウンス
  });
}

// 佐渡島の重要エリアに地図の表示領域を合わせる
// 注: このメソッドは特定地域向けの機能であり、
// 本来は地域特化モジュール（例：10_sado_optimization.md）に移動すべきです
function fitSadoIslandBounds(map: google.maps.Map): void {
  const sadoIslandBounds = new google.maps.LatLngBounds(
    { lat: 37.6, lng: 138.0 }, // 南西
    { lat: 38.4, lng: 138.6 } // 北東
  );

  map.fitBounds(sadoIslandBounds, {
    padding: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
  });
}

// デバイスに応じた操作性の設定
function configureInteractionForDevice(
  map: google.maps.Map,
  width: number,
  height: number
): void {
  // デバイスの情報を取得し、設定の基盤として利用
  const deviceInfo = getEnhancedDeviceInfo();
  const isMobile = deviceInfo.type === 'mobile';

  if (isMobile) {
    // モバイルの場合は MOBILE_MAP_OPTIONS を利用して統一性を確保
    map.setOptions(MOBILE_MAP_OPTIONS);
  } else {
    // タブレット/デスクトップ向け設定
    map.setOptions({
      // タッチデバイス向け設定
      gestureHandling: 'auto',

      // コントロール配置の最適化
      zoomControl: true,
      mapTypeControl: width > 480,
      streetViewControl: width > 1024,
      fullscreenControl: width > 480,

      // コントロールサイズ
      controlSize: 40,

      // 共通スタイルを適用
      styles: COMMON_POI_STYLES,
    });
  }
}
```

## モバイル向け最適化マップコントロール

```typescript
// モバイル向けマップオプション - 一元管理された設定
export const MOBILE_MAP_OPTIONS = {
  zoom: 9, // モバイルは広めの表示から
  maxZoom: 18, // 性能に応じて getMapOptionsForDevice で調整可能
  mapTypeControl: false, // 余計な操作を減らす
  streetViewControl: false, // 画面を広く使う
  zoomControl: false, // モバイル向けに無効化
  zoomControlOptions: {
    position: google.maps.ControlPosition.RIGHT_CENTER, // 片手操作しやすい位置
  },
  fullscreenControl: false, // 小さい画面では不要
  fullscreenControlOptions: {
    position: google.maps.ControlPosition.TOP_RIGHT,
  },
  controlSize: 32, // コントロールサイズを小さく
  gestureHandling: 'greedy', // モバイルでのマップ操作を優先
  // 共通スタイルを参照
  styles: COMMON_POI_STYLES,
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
