# 2. API初期化とライフサイクル管理

## 型定義

```typescript
/**
 * Google Maps API ローダーのオプション
 */
interface LoaderOptions {
  apiKey: string;
  version?: string;
  libraries?: string[];
  mapIds?: string[];
  authReferrerPolicy?: string;
  useStaticMap?: boolean;
  language?: string;
  region?: string;
  channel?: string;
}

/**
 * マップ最適化オプション
 */
interface OptimizationOptions {
  maxZoom?: number;
  minZoom?: number;
  disablePointsOfInterest?: boolean;
  preloadStaticData?: boolean;
}

/**
 * Google Maps 初期化オプション
 */
interface GoogleMapsInitOptions {
  elementId: string;
  zoom: number;
  onMapLoaded?: (map: google.maps.Map) => void;
  skipInit?: boolean;
  initTimeout?: number;
  centerPosition: { lat: number; lng: number };
  useCacheBuster?: boolean;
}
```

## 初期化プロセスと環境変数

Google Maps APIを初期化する際の基本的なフローは次のとおりです：

1. 環境変数の検証
2. ローダーオプションの設定
3. APIの読み込み
4. マップの初期化と最適化

```typescript
// マップの初期化と環境変数検証の統合フロー
export const initializeGoogleMaps = async (
  options: GoogleMapsInitOptions
): Promise<{
  isLoaded: boolean;
  error?: Error;
  map?: google.maps.Map;
}> => {
  // 1. 環境変数の検証
  const { isValid, messages } = validateGoogleMapsEnv();
  if (!isValid) {
    return { isLoaded: false, error: new Error(messages.join(', ')) };
  }

  // 2. ローダーオプションの設定
  const loaderOptions = getLoaderOptions();

  try {
    // 3. APIの読み込み
    await loadMapsApi(loaderOptions);

    // 4. マップインスタンスの作成
    const mapElement = document.getElementById(options.elementId);
    if (!mapElement) {
      throw new Error(`マップ要素 "${options.elementId}" が見つかりません`);
    }

    const map = new google.maps.Map(mapElement, {
      zoom: options.zoom,
      center: options.centerPosition,
      mapId: ENV.google.mapId,
    });

    // 5. 最適化設定の適用
    optimizeStaticHostingLoad(map, {
      maxZoom: 17,
      minZoom: 8,
      disablePointsOfInterest: true,
    });

    // 6. 読み込み完了コールバック
    if (options.onMapLoaded) {
      options.onMapLoaded(map);
    }

    return { isLoaded: true, map };
  } catch (error) {
    // エラーハンドリング
    logger.error('Google Maps APIのロードに失敗しました', {
      component: 'initializeGoogleMaps',
      action: 'api_load_error',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // フォールバック処理
    provideFallbackMap(options.elementId, options.centerPosition);

    return {
      isLoaded: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// 環境変数検証
export const validateGoogleMapsEnv = (): {
  isValid: boolean;
  messages: string[];
} => {
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
  }

  return { isValid, messages };
};

// ローダーオプション取得
export const getLoaderOptions = (): LoaderOptions => {
  const REQUIRED_LIBRARIES = [
    'maps',
    'marker',
    'places',
    'webgl', // 高性能レンダリング用
    'localcontext', // 地域情報強化用
  ];

  return {
    apiKey: ENV.google.apiKey,
    version: ENV.google.mapsVersion || 'weekly',
    libraries: REQUIRED_LIBRARIES,
    mapIds: getRequiredMapIds(),
    authReferrerPolicy: 'origin',
    useStaticMap: true,
    language: 'ja',
    region: 'JP',
    channel: 'sado-tourism-app',
  };
};

// 必要なマップIDを集約するヘルパー関数
const getRequiredMapIds = (): string[] => {
  const mapIds = [];
  if (ENV.google.mapId) mapIds.push(ENV.google.mapId);
  if (ENV.google.accessibleMapId) mapIds.push(ENV.google.accessibleMapId);
  if (ENV.google.darkModeMapId) mapIds.push(ENV.google.darkModeMapId);

  const seasonalMapIds = [
    ENV.google.springMapId,
    ENV.google.summerMapId,
    ENV.google.autumnMapId,
    ENV.google.winterMapId,
  ].filter(Boolean);

  return [...mapIds, ...seasonalMapIds];
};
```

## マップの最適化

```typescript
// マップ最適化の統合関数
export const optimizeStaticHostingLoad = (
  map: google.maps.Map,
  options: OptimizationOptions
): void => {
  // APIリクエスト数を削減するための設定
  map.setOptions({
    tilt: 0,
    maxZoom: options.maxZoom || 17,
    minZoom: options.minZoom || 8,
    clickableIcons: false,
  });

  // POIの無効化（必要に応じて）
  if (options.disablePointsOfInterest) {
    map.setOptions({
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });
  }

  // 静的データのプリロード
  if (options.preloadStaticData) {
    prefetchStaticMapData();
  }
};

// 静的マップデータのプリフェッチ
const prefetchStaticMapData = async (): Promise<void> => {
  try {
    // 主要なPOIデータを先読み
    await Promise.all([
      fetchStaticAsset('/data/locations.json'),
      fetchStaticAsset('/data/markers.json'),
    ]);
    logger.info('静的マップデータのプリフェッチが完了しました');
  } catch (error) {
    logger.warn('静的データのプリフェッチに失敗しました', { error });
  }
};

// フォールバック機能の実装
const provideFallbackMap = (
  elementId: string,
  center: { lat: number; lng: number }
): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // エラーメッセージを表示
  showMapLoadingError(element);

  // 静的マップをフォールバックとして表示
  attemptToLoadStaticMap(element, center);
};

// マップロードエラーの表示
const showMapLoadingError = (container: HTMLElement): void => {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'map-error';
  errorDiv.innerHTML = `
    <h3>マップの読み込みに失敗しました</h3>
    <p>しばらく経ってからもう一度お試しください。</p>
  `;
  container.appendChild(errorDiv);
};

// 静的マップのロード
const attemptToLoadStaticMap = (
  container: HTMLElement,
  center: { lat: number; lng: number }
): void => {
  const img = document.createElement('img');
  img.className = 'static-map';
  img.alt = '佐渡島マップ';
  img.src = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=11&size=600x400&key=${ENV.google.apiKey}`;
  img.onerror = () => {
    img.style.display = 'none';
    logger.error('静的マップの読み込みにも失敗しました');
  };
  container.appendChild(img);
};
```

## 使用例

```typescript
// マップコンポーネントでの使用例
const MapComponent: React.FC = () => {
  const [mapState, setMapState] = useState<{
    isLoaded: boolean;
    error?: Error;
    map?: google.maps.Map;
  }>({ isLoaded: false });

  useEffect(() => {
    const initMap = async () => {
      const result = await initializeGoogleMaps({
        elementId: 'map',
        zoom: 11,
        centerPosition: { lat: 38.0168, lng: 138.3686 }, // 佐渡島の中心座標
        initTimeout: 15000,
        useCacheBuster: ENV.isDevelopment,
      });
      setMapState(result);
    };

    initMap();
  }, []);

  return (
    <div>
      {mapState.error && <ErrorDisplay error={mapState.error} />}
      <div id="map" style={{ height: '500px', width: '100%' }}></div>
    </div>
  );
};
```
