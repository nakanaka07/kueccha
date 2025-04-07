# Google Maps統合ガイドライン

## 1. 基本理念と設計原則

### Google Maps APIの用途と重要性

佐渡で食えっちゃプロジェクトでは、Google Maps APIを使用して重要な位置情報をユーザーに視覚的に提供しています。地図統合は単なる場所の表示以上の役割を持ち、ユーザー体験の中核をなす要素です。

### 統合の基本原則

- **性能優先**: すべてのデバイスで最適な地図表示パフォーマンスを実現
- **一貫性**: 地図表示、マーカー、操作性において首尾一貫したユーザー体験を提供
- **信頼性**: エラー状況でも適切なフォールバックと回復メカニズムを実装
- **拡張性**: 将来的な機能追加に対応できる柔軟な設計を維持
- **アクセシビリティ**: 様々な利用者が使いやすいインターフェースの提供
- **セキュリティ**: APIキーやデータの適切な保護対策の実装

## 2. API初期化とライフサイクル管理

### 初期化プロセスの標準パターン

```typescript
// マップ初期化の標準パターン
const { isLoaded, error, map } = useGoogleMaps({
  elementId: 'map',
  zoom: 11,
  onMapLoaded: handleMapLoaded,
  skipInit: !isMapElementReady,
  initTimeout: 15000, // 15秒のタイムアウト
});
```

### 環境変数の設定と検証

```typescript
// 環境変数検証の標準パターン
export const validateGoogleMapsEnv = (): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  let isValid = true;

  // APIキーの検証
  if (!ENV.google.apiKey) {
    messages.push('Google Maps APIキーが設定されていません');
    isValid = false;
  }

  // MapIDの検証
  if (ENV.google.mapId && ENV.google.mapId.trim() === '') {
    messages.push('Google Maps MapIDが設定されていますが、空白文字のみです');
    isValid = false;
  }

  // APIキーの最小セキュリティチェック
  if (ENV.google.apiKey && !ENV.google.apiKeyRestrictions) {
    messages.push('APIキーに制限が設定されていない可能性があります');
    isValid = false;
  }

  // 検証結果をログに記録
  if (!isValid) {
    logger.error('Google Maps環境変数の検証に失敗しました', {
      component: 'GoogleMapsConfig',
      messages,
    });
  }

  return { isValid, messages };
};
```

### ライブラリの効率的なロード戦略

- **必要なライブラリのみロード**: `maps`、`marker`など必要最小限のライブラリを指定
- **遅延ロード**: マップが実際に必要になるタイミングでロード
- **バージョン管理**: APIバージョンを環境変数で一元管理
- **最新APIのサポート**: Maps JavaScript API v3.54以降の機能を活用

```typescript
// ライブラリ指定の例（v3.54以降対応）
const REQUIRED_LIBRARIES = ['maps', 'marker', 'places'];

export const getLoaderOptions = (): LoaderOptions => {
  return {
    apiKey: ENV.google.apiKey,
    version: ENV.google.mapsVersion || 'weekly',
    libraries: REQUIRED_LIBRARIES,
    mapIds: ENV.google.mapId ? [ENV.google.mapId] : [],
    // 新しいMapタイプ機能をサポート
    authReferrerPolicy: 'origin'
  };
};
```

### エラーハンドリングとリカバリー戦略

```typescript
// マップ読み込みエラーのハンドリング
try {
  await loadMapsApi(loaderOptions, apiKey);
} catch (error) {
  logger.error('Google Maps APIのロードに失敗しました', {
    component: 'useGoogleMaps',
    action: 'api_load_error',
    version: loaderOptions.version,
    errorMessage: error instanceof Error ? error.message : String(error)
  });
  
  // フォールバック機能の提供
  showMapLoadingError();
  attemptToLoadStaticMap();
}
```

## 3. マーカー管理のベストプラクティス

### マーカー種類の選択基準

- **Advanced Marker**: 最新のカスタマイズ機能を活用する場合に使用
- **従来のMarker**: 互換性が必要な場合や特定のカスタム要件がある場合に使用

```typescript
// マーカー種類を適切に選択する例
function createMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement | google.maps.Marker {
  // Advanced Marker APIが利用可能かどうかをチェック
  const useAdvancedMarker =
    typeof google.maps.marker !== 'undefined' &&
    'AdvancedMarkerElement' in google.maps.marker &&
    typeof google.maps.marker.AdvancedMarkerElement === 'function';

  return useAdvancedMarker
    ? createAdvancedMarker(poi)
    : createLegacyMarker(poi);
}
```

### 効率的なマーカーの作成と更新

- **ポイントの識別**: 各マーカーに一意のIDを割り当てる
- **キャッシュ**: マーカーオブジェクトをキャッシュして再利用
- **バッチ更新**: マーカー更新を一度にまとめて処理

```typescript
// マーカーキャッシュの例
const markerCacheRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>>(
  new Map()
);

// POIのIDを一貫して取得するヘルパー関数
const getPoiId = useCallback((poi: PointOfInterest): string => {
  return poi.id || `${poi.lat}-${poi.lng}-${poi.name}`;
}, []);

// マーカーの取得または作成
function getOrCreateMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement | google.maps.Marker {
  const id = getPoiId(poi);
  const existingMarker = markerCacheRef.current.get(id);
  
  if (existingMarker) {
    updateMarker(existingMarker, poi);
    return existingMarker;
  }
  
  const newMarker = createMarker(poi);
  markerCacheRef.current.set(id, newMarker);
  return newMarker;
}
```

### カスタムマーカーの作成とスタイリング

```typescript
// Advanced Markerのカスタマイズ例
function createCustomAdvancedMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement {
  return new google.maps.marker.AdvancedMarkerElement({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name,
    content: (() => {
      // PinElementが利用可能な場合はそれを使用
      if ('PinElement' in google.maps.marker) {
        const pin = new google.maps.marker.PinElement({
          background: getIconUrl(poi.category),
          scale: poi.isHighlighted ? 1.2 : 1,
          glyph: poi.isClosed ? '×' : '',
          glyphColor: poi.isClosed ? '#ff0000' : '',
          borderColor: poi.isRecommended ? '#FFD700' : ''
        });
        return pin.element;
      } 
      
      // フォールバックとしてカスタムDIV要素を使用
      const div = document.createElement('div');
      div.style.backgroundImage = `url(${getIconUrl(poi.category)})`;
      div.style.width = '32px';
      div.style.height = '32px';
      div.style.backgroundSize = 'cover';
      return div;
    })()
  });
}
```

### イベントハンドリングとメモリリーク防止

```typescript
// マーカーイベントの適切な管理
function setupMarkerEvents(marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker, poi: PointOfInterest) {
  // クリックイベントのセットアップ
  const clickListener = marker.addListener('click', () => {
    onMarkerClick(poi);
  });
  
  // クリーンアップ用のフィルターを保存
  listenerRefs.current.push({
    marker,
    listener: clickListener,
    poiId: poi.id
  });
}

// コンポーネントのアンマウント時にリスナーをクリーンアップ
useEffect(() => {
  return () => {
    listenerRefs.current.forEach(({ marker }) => {
      google.maps.event.clearInstanceListeners(marker);
    });
    listenerRefs.current = [];
  };
}, []);
```

## 4. マーカークラスタリング実装

### クラスタリング設定のベストプラクティス

```typescript
// クラスタリング設定の例
const setupClustering = (markers: google.maps.marker.AdvancedMarkerElement[], map: google.maps.Map): MarkerClusterer => {
  return new MarkerClusterer({
    map,
    markers,
    renderer: {
      render: ({ count, position }) => {
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content: createClusterIcon(count)
        });
      }
    },
    // クラスタリングアルゴリズムのオプション
    algorithm: {
      maxZoom: 14,           // このズームレベル以上ではクラスタリングしない
      gridSize: 60,          // クラスタリングのグリッドサイズ（ピクセル）
      minimumClusterSize: 3  // クラスタを形成する最小マーカー数
    }
  });
};
```

### カスタムクラスターレンダラーの実装

```typescript
// カスタムクラスターアイコンの作成
function createClusterIcon(count: number): HTMLElement {
  const div = document.createElement('div');
  
  // 数に応じてスタイル変更
  const size = Math.min(45, Math.max(35, 35 + Math.log10(count) * 5));
  const fontSize = Math.min(18, Math.max(13, 13 + Math.log10(count) * 2));
  
  div.style.width = `${size}px`;
  div.style.height = `${size}px`;
  div.style.borderRadius = '50%';
  div.style.backgroundColor = count > 100 ? '#FF5252' : count > 50 ? '#FF9800' : '#4CAF50';
  div.style.border = '2px solid white';
  div.style.boxSizing = 'border-box';
  div.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
  div.style.color = 'white';
  div.style.fontWeight = 'bold';
  div.style.fontSize = `${fontSize}px`;
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.textContent = count.toString();
  
  return div;
}
```

### クラスタリングのパフォーマンス最適化

- **遅延クラスタリング**: マップの動きが止まった時のみクラスタリングを更新
- **計算分散**: 非同期処理を利用してUIブロッキングを防止
- **ズームレベル対応**: ズームレベルに応じたクラスタリング戦略の変更

```typescript
// 遅延クラスタリングの例
const debouncedUpdateClusters = useMemo(() => {
  return debounce((markers: google.maps.marker.AdvancedMarkerElement[], clusterer: MarkerClusterer) => {
    clusterer.clearMarkers();
    clusterer.addMarkers(markers);
  }, 300);
}, []);

// マップ移動時の処理
map.addListener('idle', () => {
  if (enableClustering && filteredMarkers.length > MIN_MARKERS_FOR_CLUSTERING) {
    debouncedUpdateClusters(filteredMarkers, clusterer);
  }
});
```

## 5. レスポンシブマップ設計

### デバイス検出と設定の自動切り替え

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

### モバイル向け最適化マップコントロール

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

### 表示サイズと読み込み戦略

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

## 6. エラー処理とフォールバック戦略

### API読み込み失敗時の対応

```typescript
// API読み込み失敗時の対応例
const handleApiLoadError = (error: unknown): void => {
  logger.error('Google Maps APIのロードに失敗しました', {
    component: 'MapContainer',
    action: 'api_load_error',
    error: error instanceof Error ? error.message : String(error)
  });
  
  // 静的地図画像へのフォールバック
  showStaticMapImage();
  
  // ユーザーへの通知
  showErrorNotification('地図の読み込みに失敗しました。再試行してください。');
  
  // 再試行オプションの提供
  offerRetryButton(() => {
    reloadMapsApi();
  });
};
```

### マーカーライブラリ未対応時の代替実装

```typescript
// マーカーライブラリ未対応時のフォールバック
function createMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement | google.maps.Marker {
  try {
    // Advanced Markerを試みる
    if (typeof google.maps.marker !== 'undefined' &&
        'AdvancedMarkerElement' in google.maps.marker) {
      return createAdvancedMarker(poi);
    }
  } catch (error) {
    logger.warn('Advanced Markerの作成に失敗しました。従来のMarkerを使用します', {
      component: 'MapMarkers',
      action: 'fallback_to_legacy_marker',
      poiId: poi.id
    });
  }
  
  // 従来のMarkerへフォールバック
  return createLegacyMarker(poi);
}
```

### 回復と再試行メカニズム

```typescript
// 再試行ロジックの例
function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  return new Promise<T>(async (resolve, reject) => {
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        const result = await operation();
        return resolve(result);
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) {
          return reject(error);
        }
        
        // 指数バックオフで待機時間を増加
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        logger.info(`操作に失敗しました。${delayMs}ms後に再試行します (${attempt}/${maxRetries})`, {
          component: 'RetryHandler',
          action: 'retry_operation',
          error: error instanceof Error ? error.message : String(error),
          attempt,
          maxRetries
        });
        
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  });
}
```

## 7. パフォーマンス最適化

### マーカーの遅延読み込みと表示範囲最適化

```typescript
// マーカーの遅延読み込み実装例
const useMarkerVisibility = ({
  mapRef,
  markers,
  visibilityMargin = 0.5, // 表示領域を50%拡張
  debounceMs = 300
}) => {
  const [visibleMarkers, setVisibleMarkers] = useState<typeof markers>([]);
  
  // 表示範囲の計算を最適化
  const updateVisibleMarkers = useMemo(() => {
    return debounce(() => {
      const map = mapRef.current;
      if (!map) return;
      
      const bounds = map.getBounds();
      if (!bounds) return;
      
      // 表示範囲を拡張
      const extendedBounds = calculateExtendedBounds(bounds, visibilityMargin);
      
      // 表示範囲内のマーカーのみをフィルタリング
      const newVisibleMarkers = markers.filter(marker => {
        const position = marker.position;
        return position && extendedBounds.contains(position);
      });
      
      setVisibleMarkers(newVisibleMarkers);
    }, debounceMs);
  }, [mapRef, markers, visibilityMargin, debounceMs]);
  
  // マップの移動やズーム変更時にマーカー表示を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    const listeners = [
      map.addListener('idle', updateVisibleMarkers),
      map.addListener('zoom_changed', updateVisibleMarkers)
    ];
    
    // 初回実行
    updateVisibleMarkers();
    
    return () => {
      listeners.forEach(listener => google.maps.event.removeListener(listener));
    };
  }, [mapRef, updateVisibleMarkers]);
  
  return { visibleMarkers };
};

// 拡張した地図表示領域を計算
function calculateExtendedBounds(
  bounds: google.maps.LatLngBounds, 
  margin: number
): google.maps.LatLngBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  const latSpan = ne.lat() - sw.lat();
  const lngSpan = ne.lng() - sw.lng();
  
  const extendedBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(
      sw.lat() - latSpan * margin,
      sw.lng() - lngSpan * margin
    ),
    new google.maps.LatLng(
      ne.lat() + latSpan * margin,
      ne.lng() + lngSpan * margin
    )
  );
  
  return extendedBounds;
}
```

### 地図タイルとAPIリソースの最適化

- **初期マップ範囲の適切な設定**: 佐渡島全体が表示される範囲に限定
- **ライブラリの選択的読み込み**: 必要なAPIライブラリのみロード
- **需要ベースのタイル読み込み**: 表示される可能性が高い領域のタイルを優先的に読み込み
- **WebGL レンダリングの活用**: パフォーマンス向上のためのWebGLモード設定

```typescript
// WebGLレンダリング設定を含むマップ初期化オプション
const DEFAULT_MAP_OPTIONS = {
  center: { lat: 38.0413, lng: 138.3689 }, // 佐渡島の中心
  zoom: 10, // 島全体が見える程度
  minZoom: 7, // 過度にズームアウトを制限
  maxZoom: 18, // ズームインも適切に制限
  restriction: {
    latLngBounds: {
      north: 38.4,  // 佐渡島周辺に制限
      south: 37.6,
      east: 138.8,
      west: 137.9
    },
    strictBounds: false // 少しの余裕を持たせる
  },
  // WebGLレンダリングを有効化
  mapId: 'YOUR_MAP_ID', // Cloud Console で作成したMapID
  useStaticMap: true, // 初期表示を高速化
};

// WebGLレンダリングの確認
function isWebGLSupported(map: google.maps.Map): boolean {
  return Boolean(map.getMapCapabilities().isAdvancedMarkersAvailable);
}
```

### メモリ使用量の最適化

```typescript
// マーカーのクリーンアップ例
function cleanupMarkers(
  markers: (google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[],
  clusterer: MarkerClusterer | null
): void {
  // イベントリスナーを削除
  markers.forEach(marker => {
    google.maps.event.clearInstanceListeners(marker);
  });
  
  // マーカーをマップから削除
  markers.forEach(marker => {
    if ('map' in marker) {
      marker.map = null;
    } else if ('setMap' in marker) {
      marker.setMap(null);
    }
  });

  // クラスタラーをクリーンアップ
  if (clusterer) {
    clusterer.clearMarkers();
    clusterer.setMap(null);
  }
}

// コンポーネントのクリーンアップ処理
useEffect(() => {
  return () => {
    cleanupMarkers(currentMarkers, currentClusterer);
  };
}, []);
```

## 8. アクセシビリティとユーザビリティ対応

### スクリーンリーダー対応

```typescript
// アクセシブルなマーカーの作成
function createAccessibleMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement {
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name, // スクリーンリーダーで読み上げられるタイトル
    content: (() => {
      const element = document.createElement('div');
      element.className = 'marker';
      element.style.cursor = 'pointer';
      element.style.backgroundImage = `url(${getIconUrl(poi.category)})`;
      element.style.width = '32px';
      element.style.height = '32px';
      
      // アクセシビリティ属性の追加
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', `${poi.name}、${getCategoryName(poi.category)}、緯度経度 ${poi.lat}、${poi.lng}`);
      element.setAttribute('tabindex', '0');
      
      // キーボード操作のサポート
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onMarkerClick(poi);
        }
      });
      
      return element;
    })(),
  });
  
  return marker;
}
```

### キーボード操作対応

```typescript
// キーボード操作に対応したマップコントロール
function setupKeyboardAccessibility(map: google.maps.Map) {
  // フォーカストラップ対策
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.setAttribute('tabindex', '-1');
    
    // Escキーでマップからフォーカスを外せるようにする
    mapContainer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const exitMapButton = document.getElementById('exit-map-button');
        if (exitMapButton) {
          exitMapButton.focus();
        }
      }
    });
  }
  
  // マップコントロールのアクセシビリティ強化
  const setupA11yForControl = (controlId: string, label: string) => {
    const control = document.getElementById(controlId);
    if (control) {
      control.setAttribute('aria-label', label);
      control.setAttribute('role', 'button');
      control.setAttribute('tabindex', '0');
    }
  };
  
  // 各コントロールの設定
  setupA11yForControl('zoom-in-button', 'ズームイン');
  setupA11yForControl('zoom-out-button', 'ズームアウト');
  setupA11yForControl('fullscreen-button', '全画面表示切り替え');
}
```

### 視覚的ユーザビリティの強化

```typescript
// 視認性を高めるマップスタイルの設定
function applyAccessibleMapStyles(map: google.maps.Map) {
  // コントラストを高めたカスタムマップスタイル
  const highContrastStyle = [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }]
    },
    {
      featureType: 'road',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ weight: 2 }]
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'on' }]
    }
  ];
  
  map.setOptions({
    styles: highContrastStyle
  });
}
```

## 9. セキュリティ対策

### APIキー保護

```typescript
// APIキーのセキュリティ対策
function setupSecureApiKey(): string {
  const apiKey = ENV.google.apiKey;
  
  // APIキーが適切に保護されているか確認
  if (!ENV.google.apiKeyRestrictions) {
    logger.warn('APIキーにHTTPリファラ制限が設定されていない可能性があります', {
      component: 'SecurityCheck',
      action: 'api_key_security_warning'
    });
  }
  
  // CSP設定の確認
  const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!metaCSP) {
    logger.warn('Content Security Policyが設定されていません', {
      component: 'SecurityCheck',
      action: 'csp_missing_warning'
    });
  }
  
  return apiKey;
}
```

### XSS対策

```typescript
// XSS対策を含むInfoWindow実装
function createSafeInfoWindow(content: string, poi: PointOfInterest): google.maps.InfoWindow {
  // 潜在的に危険な文字をエスケープ
  const sanitize = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  // 安全なHTMLを構築
  const safeContent = `
    <div class="info-window">
      <h3>${sanitize(poi.name)}</h3>
      <p>${sanitize(poi.description || '')}</p>
      ${poi.imageUrl ? `<img src="${sanitize(poi.imageUrl)}" alt="${sanitize(poi.name)}" width="100%">` : ''}
      ${poi.url ? `<a href="${sanitize(poi.url)}" target="_blank" rel="noopener noreferrer">詳細情報</a>` : ''}
    </div>
  `;
  
  return new google.maps.InfoWindow({
    content: safeContent,
    maxWidth: 300
  });
}
```

## 10. 佐渡島固有の最適化

### 地域に特化したマップ設定

```typescript
// 佐渡島専用のマップ初期設定
const SADO_ISLAND_MAP_OPTIONS = {
  center: { lat: 38.0413, lng: 138.3689 }, // 佐渡島の中心
  zoom: 10, // 島全体が見える程度
  minZoom: 7,
  maxZoom: 18,
  // 佐渡島の地図境界を設定
  restriction: {
    latLngBounds: {
      north: 38.4,
      south: 37.6,
      east: 138.8,
      west: 137.9
    },
    strictBounds: false
  },
  // 佐渡島の地形を強調表示
  mapTypeId: google.maps.MapTypeId.TERRAIN,
  // 地形の高さを強調
  tilt: 0,
  // カスタムマップスタイル
  styles: SADO_ISLAND_CUSTOM_STYLES
};

// 佐渡島の地域に合わせたカスタムスタイル
const SADO_ISLAND_CUSTOM_STYLES = [
  {
    // 佐渡島の海岸線を強調
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [
      { color: '#a3ccff' }
    ]
  },
  {
    // 佐渡の山地を視覚的に識別しやすく
    featureType: 'landscape.natural.landcover',
    elementType: 'geometry.fill',
    stylers: [
      { color: '#c5dea6' },
      { saturation: 30 }
    ]
  },
  {
    // 主要道路を強調
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [
      { color: '#ffaa00' },
      { weight: 3 }
    ]
  }
];
```

### 日本語地図表示の最適化

```typescript
// 日本語表示の最適化
function optimizeJapaneseMapDisplay(map: google.maps.Map) {
  // 日本語フォントの最適化
  const japaneseOptimizedStyles = [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#212121' }]
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }, { weight: 2 }]
    },
    {
      // 地名の表示を最適化
      featureType: 'administrative.locality',
      elementType: 'labels.text',
      stylers: [{ visibility: 'on' }, { weight: 1 }]
    }
  ];
  
  // 地図の言語を日本語に設定
  map.setOptions({
    styles: japaneseOptimizedStyles,
    language: 'ja'
  });
}
```

### 季節イベント対応

```typescript
// 佐渡島の季節イベント対応
function applySadoSeasonalTheme(map: google.maps.Map) {
  const now = new Date();
  const month = now.getMonth() + 1;
  
  let seasonalStyle = [];
  
  // 季節に応じたスタイル変更
  if (month >= 3 && month <= 5) {
    // 春（3-5月）- 佐渡の桜
    seasonalStyle = SADO_SPRING_STYLES;
  } else if (month >= 6 && month <= 8) {
    // 夏（6-8月）- 海水浴シーズン
    seasonalStyle = SADO_SUMMER_STYLES;
  } else if (month >= 9 && month <= 11) {
    // 秋（9-11月）- 紅葉
    seasonalStyle = SADO_AUTUMN_STYLES;
  } else {
    // 冬（12-2月）- 雪景色
    seasonalStyle = SADO_WINTER_STYLES;
  }
  
  // 現在のスタイルと季節スタイルをマージ
  const currentStyles = map.get('styles') || [];
  map.setOptions({
    styles: [...currentStyles, ...seasonalStyle]
  });
}

// 春のスタイル例（桜の時期）
const SADO_SPRING_STYLES = [
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffeeff' }, { saturation: 20 }]
  }
];
```

## 11. スタイリングと設定の互換性

### mapIDとカスタムスタイルの関係

```typescript
// mapIDとカスタムスタイルの適切な組み合わせ方
function configureMapStyling(map: google.maps.Map): void {
  // 前提：環境変数からのmapID取得
  const mapId = ENV.google.mapId;
  
  if (mapId) {
    // Cloud Consoleで設計したスタイルを使用する場合
    map.mapId = mapId;
    logger.info('Cloud Consoleで設計されたMapIDスタイルを適用します', {
      component: 'MapStyling',
      mapId
    });
    
    // 重要: インラインスタイルの適用に関する注意
    // - mapIdが設定されている場合、一部のスタイル設定は上書きされません
    // - 特にfeatureType/elementTypeベースのスタイルはmapIdの設定が優先されます
    
    // 補足的なスタイルのみを追加（競合しない要素のみ）
    const supplementalStyles = [
      // 特定の要素だけを選択的に上書き
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'simplified' }]
      }
    ];
    
    map.setOptions({ styles: supplementalStyles });
  } else {
    // mapIdがない場合は完全なインラインスタイルを適用
    logger.info('インラインスタイル設定を適用します', {
      component: 'MapStyling'
    });
    map.setOptions({
      styles: SADO_ISLAND_CUSTOM_STYLES
    });
  }
}

// mapIdとインラインスタイルの競合を避けるベストプラクティス
const STYLE_COMPATIBILITY_RECOMMENDATIONS = {
  // mapIdを使う場合の推奨事項
  withMapId: [
    '• Cloud Consoleでスタイルを完全に管理し、コード内でのスタイル定義を最小限に',
    '• 必要な場合は補足的なスタイル（例：特定のPOIの表示/非表示）のみをコードで適用',
    '• スタイル変更が必要な場合はCloud Consoleで行い、アプリケーションの再デプロイ不要'
  ],
  
  // インラインスタイルを使う場合の推奨事項
  withInlineStyles: [
    '• mapIdを設定せず、すべてのスタイルをコード内で完全に管理',
    '• 動的なスタイル変更（季節、時間帯、ユーザー設定など）が必要な場合に適している',
    '• スタイル変更にはコード更新と再デプロイが必要'
  ],
  
  // ハイブリッドアプローチ（注意が必要）
  hybrid: [
    '• mapIdをベースとして使用し、特定の状況下で限定的なスタイルを上書き',
    '• 競合の可能性を常に考慮し、テスト環境で十分に検証が必要',
    '• 上書きが効かない場合は、異なるmapIdを用意するか完全にインラインスタイルに移行'
  ]
};

// 実装例：季節によるスタイル変更とmapIdの併用
function applySeasonnalThemeWithMapId(map: google.maps.Map) {
  // 基本スタイルはmapIdで設定済みと仮定
  const mapId = ENV.google.mapId;
  if (!mapId) {
    logger.warn('mapIdが設定されていないため、季節テーマを直接適用します', {
      component: 'SeasonalTheme'
    });
    applySadoSeasonalTheme(map); // 直接すべてのスタイルを適用
    return;
  }
  
  // mapIdがある場合は補足的なスタイルのみを追加
  const now = new Date();
  const month = now.getMonth() + 1;
  
  // 季節ごとに異なるmapIdを使い分ける（推奨アプローチ）
  if (month >= 3 && month <= 5 && ENV.google.springMapId) {
    // 春用のmapIdが設定されている場合
    map.mapId = ENV.google.springMapId;
  } else if (month >= 6 && month <= 8 && ENV.google.summerMapId) {
    // 夏用のmapIdが設定されている場合
    map.mapId = ENV.google.summerMapId;
  } else {
    // デフォルトのmapIdを使用
    map.mapId = mapId;
    
    // 補足的な季節スタイルを適用（一部要素のみ）
    // 注意: これらは基本スタイルと競合する可能性があります
    const limitedSeasonalStyle = getSeasonSpecificOverrides(month);
    if (limitedSeasonalStyle.length > 0) {
      map.setOptions({ styles: limitedSeasonalStyle });
    }
  }
}
```

### 2025年4月時点の最新情報

2025年4月現在、Google Maps Platform APIではmapIdを使用したスタイリングが推奨アプローチとなっています。mapIdを使用すると以下のメリットがあります：

1. **パフォーマンスの向上**: 事前にコンパイルされたスタイルによる描画速度の向上
2. **管理の容易さ**: Cloud Consoleでの視覚的なスタイル編集
3. **デプロイの簡易化**: コードを変更せずにスタイル更新が可能
4. **アセット管理の統合**: マップスタイルを他のGCP資産と一元管理

当プロジェクトでは、以下のアプローチを推奨します：

```typescript
// 推奨アプローチ：目的別にmapIdを使い分ける
const MAP_IDS = {
  default: ENV.google.mapId,           // 標準表示用
  accessible: ENV.google.accessibleMapId,  // 高コントラスト版
  satellite: ENV.google.satelliteMapId,    // 衛星写真ベース
  // 季節別mapId
  spring: ENV.google.springMapId,
  summer: ENV.google.summerMapId,
  autumn: ENV.google.autumnMapId,
  winter: ENV.google.winterMapId,
};

// 目的に応じたmapIdの切り替え
function switchToAccessibleMap(map: google.maps.Map) {
  if (MAP_IDS.accessible) {
    map.mapId = MAP_IDS.accessible;
  } else {
    // フォールバック：インラインスタイルでアクセシブルスタイルを適用
    applyAccessibleMapStyles(map);
  }
}
```

## 12. 推奨プラクティスチェックリスト

- [x] **API初期化の最適化**: 必要なライブラリのみをロードし、APIキーを適切に保護
- [x] **マーカー管理**: Advanced Markerと従来のMarkerの適切な使い分け、キャッシュ活用
- [x] **クラスタリング**: 大量マーカー処理のためのクラスタリング実装
- [x] **エラーハンドリング**: API読み込み失敗やマップ初期化エラーへの対応
- [x] **レスポンシブ対応**: モバイルからデスクトップまで様々なデバイスに最適化
- [x] **メモリ管理**: マーカーやイベントリスナーの適切なクリーンアップ
- [x] **パフォーマンス最適化**: マーカーの遅延読み込みや表示範囲最適化
- [x] **ユーザビリティ**: ズームコントロールや全画面表示ボタンの適切な配置
- [x] **アクセシビリティ**: スクリーンリーダー対応とキーボード操作のサポート
- [x] **セキュリティ対策**: APIキーの保護とXSS対策の実装
- [x] **地域最適化**: 佐渡島特有の地図表示最適化
- [x] **スタイル管理**: mapIdとインラインスタイルの適切な使い分け

> **関連ガイドライン**: 
> - [環境変数管理ガイドライン](./env_usage_guidelines.md) - Google Maps API設定用の環境変数管理
> - [ロガー使用ガイドライン](./logger_usage_guidelines.md) - 地図コンポーネントでのログ記録
> - [コード最適化ガイドライン](./code_optimization_guidelines.md) - パフォーマンス最適化テクニック
>
> **参考リンク**：
> - [Google Maps JavaScript API公式ドキュメント](https://developers.google.com/maps/documentation/javascript)
> - [Google Maps Platform Best Practices](https://developers.google.com/maps/documentation/javascript/best-practices)
> - [GoogleMaps MarkerClusterer](https://github.com/googlemaps/js-markerclusterer)
> - [Advanced Marker Documentation](https://developers.google.com/maps/documentation/javascript/advanced-markers)
> - [Google Maps API v3.54 更新情報](https://developers.google.com/maps/documentation/javascript/releases)
> - [Maps JavaScript API アクセシビリティ](https://developers.google.com/maps/documentation/javascript/accessibility)
> - [Maps API セキュリティプラクティス](https://developers.google.com/maps/api-security-best-practices)