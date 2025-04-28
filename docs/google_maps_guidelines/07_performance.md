# 7. パフォーマンス最適化

## マーカーの遅延読み込みと表示範囲最適化

```typescript
// マーカーの遅延読み込み実装例
const useMarkerVisibility = ({
  mapRef,
  markers,
  visibilityMargin = 0.5, // 表示領域を50%拡張
  debounceMs = 300,
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

      // パフォーマンスメトリクスを記録
      logger.debug('マーカー表示最適化', {
        component: 'MarkerVisibility',
        totalMarkers: markers.length,
        visibleMarkers: newVisibleMarkers.length,
        hiddenMarkers: markers.length - newVisibleMarkers.length,
        optimizationRatio:
          (
            ((markers.length - newVisibleMarkers.length) / markers.length) *
            100
          ).toFixed(1) + '%',
      });
    }, debounceMs);
  }, [mapRef, markers, visibilityMargin, debounceMs]);

  // マップの移動やズーム変更時にマーカー表示を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const listeners = [
      map.addListener('idle', updateVisibleMarkers),
      map.addListener('zoom_changed', updateVisibleMarkers),
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

## 静的ホスティング環境向けのパフォーマンス最適化

```typescript
// 静的ホスティング環境でのパフォーマンス最適化策
export function optimizeForStaticHosting(map: google.maps.Map): void {
  // 1. API呼び出し回数を最小化するための設定
  map.setOptions({
    // 不要な詳細情報を制限
    clickableIcons: false, // Google POIのクリックを無効化
    disableDefaultUI: true, // 不要なUIコントロールを無効化

    // 必要なUIコントロールのみを有効化
    zoomControl: true,
    mapTypeControl: false, // マップタイプの切り替えを無効化
    streetViewControl: false, // ストリートビューを無効化
    fullscreenControl: true,
  });

  // 2. キャッシュ戦略の最適化
  if ('cacheStorage' in window) {
    precacheCriticalMapAssets();
  }

  // 3. タイルロード戦略の最適化
  const sadoIslandBounds = new google.maps.LatLngBounds(
    { lat: 37.6, lng: 138.0 }, // 南西
    { lat: 38.4, lng: 138.6 } // 北東
  );

  // 佐渡島周辺の主要ズームレベルのタイルを優先的にロード
  prefetchPriorityMapTiles(sadoIslandBounds, [9, 10, 11]);

  // 4. WebWorkerでの処理を活用（可能な場合）
  if (window.Worker) {
    setupMarkerProcessingWorker();
  }

  // 5. レンダリングのパフォーマンス監視
  setupRenderingPerformanceMonitoring(map);
}

// レンダリングパフォーマンスの監視
function setupRenderingPerformanceMonitoring(map: google.maps.Map): void {
  let frameCount = 0;
  let lastTime = performance.now();

  // フレームレート監視
  const monitorFrameRate = () => {
    const now = performance.now();
    frameCount++;

    // 1秒ごとにフレームレートを計測
    if (now - lastTime >= 1000) {
      const fps = frameCount;
      frameCount = 0;
      lastTime = now;

      // パフォーマンスが低下している場合は最適化を実行
      if (fps < 30) {
        applyLowPerformanceOptimizations(map, fps);
      }

      // パフォーマンスメトリクスをログに記録
      logger.debug('マップレンダリングパフォーマンス', {
        component: 'MapRenderer',
        fps,
        performanceCategory: fps < 30 ? 'low' : fps < 50 ? 'medium' : 'high',
      });
    }

    requestAnimationFrame(monitorFrameRate);
  };

  requestAnimationFrame(monitorFrameRate);
}
```

## 地図タイルとAPIリソースの最適化

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
      north: 38.4, // 佐渡島周辺に制限
      south: 37.6,
      east: 138.8,
      west: 137.9,
    },
    strictBounds: false, // 少しの余裕を持たせる
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

## メモリ使用量の最適化

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

## 2025年版WebGL処理による高速化

```typescript
// WebGLオーバーレイを使用した高速描画
class SadoIslandWebGLOverlay extends google.maps.webgl.WebGLOverlayView {
  private points: PointOfInterest[] = [];
  private program: WebGLProgram | null = null;
  private buffers: Record<string, WebGLBuffer> = {};

  constructor(points: PointOfInterest[]) {
    super();
    this.points = points;
  }

  // WebGLコンテキストが初期化されたときに呼び出される
  onAdd() {
    // 必要なリソースの初期化
    logger.debug('WebGLオーバーレイの初期化', {
      component: 'WebGLOverlay',
      action: 'onAdd',
      pointCount: this.points.length,
    });
  }

  // WebGLコンテキストがロストしたときに呼び出される
  onContextLost() {
    logger.warn('WebGLコンテキストがロストしました', {
      component: 'WebGLOverlay',
      action: 'onContextLost',
    });
    this.program = null;
    this.buffers = {};
  }

  // WebGLコンテキストが回復したときに呼び出される
  onContextRestored(options: google.maps.webgl.WebGLDrawOptions) {
    logger.info('WebGLコンテキストが回復しました', {
      component: 'WebGLOverlay',
      action: 'onContextRestored',
    });
    this.initializeGLResources(options.gl);
  }

  // WebGLリソースの初期化
  private initializeGLResources(gl: WebGLRenderingContext) {
    // シェーダープログラムの初期化
    const vertexShader = this.createShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource
    );
    const fragmentShader = this.createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) return;

    // プログラムの作成とリンク
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      logger.error('シェーダープログラムのリンクに失敗しました', {
        component: 'WebGLOverlay',
        action: 'initializeGLResources',
        error: gl.getProgramInfoLog(this.program),
      });
      return;
    }

    // バッファの初期化
    this.initializeBuffers(gl);
  }

  // 描画処理
  onDraw(options: google.maps.webgl.WebGLDrawOptions) {
    const gl = options.gl;

    // WebGL処理の最適化：ビューポート外のポイントは処理しない
    const visiblePoints = this.filterVisiblePoints(options.transformer);

    if (!this.program) {
      this.initializeGLResources(gl);
      if (!this.program) return;
    }

    gl.useProgram(this.program);

    // 最新の2025年WebGLパイプラインの活用
    this.setupAttributes(gl);
    this.updateDynamicBuffers(gl, visiblePoints, options.transformer);

    // 高効率な描画コール
    const pointCount = visiblePoints.length;
    gl.drawArrays(gl.POINTS, 0, pointCount);

    // パフォーマンスデータを記録
    if (ENV.isDevelopment) {
      this.logPerformanceMetrics(pointCount);
    }
  }

  // ビューポート内の点のみをフィルタリング
  private filterVisiblePoints(transformer: any): PointOfInterest[] {
    const visiblePoints: PointOfInterest[] = [];

    for (const point of this.points) {
      const worldPosition = transformer.fromLatLngAltitude({
        lat: point.lat,
        lng: point.lng,
        altitude: 0,
      });

      // 画面外の点は除外（ビューフラスタムカリング）
      if (
        worldPosition.x < -1 ||
        worldPosition.x > 1 ||
        worldPosition.y < -1 ||
        worldPosition.y > 1
      ) {
        continue;
      }

      visiblePoints.push(point);
    }

    return visiblePoints;
  }

  // 削除時の処理
  onRemove() {
    // リソースのクリーンアップ
    logger.debug('WebGLオーバーレイを削除します', {
      component: 'WebGLOverlay',
      action: 'onRemove',
    });
  }
}
```

## 2025年版ベクターマップの最適化

```typescript
// ベクターマップを最大限に活用するための設定
function setupOptimizedVectorMap(map: google.maps.Map): void {
  // マップの機能をチェック
  const capabilities = map.getMapCapabilities();

  if (capabilities.isVectorMapAvailable) {
    logger.info('ベクターマップ機能が利用可能です。最適化設定を適用します', {
      component: 'MapOptimization',
      action: 'setup_vector_map',
    });

    // ベクターマップ専用の最適化設定
    const vectorMapOptions = {
      // ベクターデータの詳細レベルを設定
      vectorDetail: 'high', // high, medium, low

      // 2025年の新機能：視覚的なエフェクトの強化
      visualEffects: {
        // 建物の3D表示をシンプル化して高速化
        buildingRenderMode: '3d-simplified',
        // 地形表示の最適化
        terrainRenderMode: 'optimized',
        // 道路のレンダリングレベル
        roadDetail: 'medium',
      },
    };

    // @ts-ignore - 2025年の最新APIにはこれらのオプションがあるが、型定義が追いついていない可能性
    map.setVectorOptions(vectorMapOptions);

    // レンダリングモードの最適化
    setupOptimizedRenderingMode(map);
  } else {
    logger.info(
      'ベクターマップ機能が利用できません。ラスターマップの最適化を適用します',
      {
        component: 'MapOptimization',
        action: 'fallback_to_raster',
      }
    );

    // ラスターマップの最適化
    setupRasterMapOptimizations(map);
  }
}

// デバイスパフォーマンスに基づくレンダリングモードの設定
function setupOptimizedRenderingMode(map: google.maps.Map): void {
  // デバイスの性能に応じてレンダリングモードを調整
  const deviceInfo = getDevicePerformanceProfile();

  // 低性能デバイスの場合
  if (deviceInfo.performanceLevel === 'low') {
    logger.info('低性能デバイスを検出。バッテリー節約モードを有効化', {
      component: 'MapOptimization',
      action: 'enable_battery_saving',
    });

    // バッテリー節約モード
    enableBatterySavingMode(map);
  }
  // 高性能デバイスの場合
  else if (deviceInfo.performanceLevel === 'high') {
    logger.info('高性能デバイスを検出。高品質レンダリングを有効化', {
      component: 'MapOptimization',
      action: 'enable_high_quality',
    });

    // 高品質レンダリングを有効化
    enableHighQualityRendering(map);
  }

  // 環境に応じた適応型レンダリング（2025年の新機能）
  setupAdaptiveRendering(map);
}

// 環境に応じた適応型レンダリング設定
function setupAdaptiveRendering(map: google.maps.Map): void {
  // マップのレンダリング頻度を状況に応じて調整
  map.addListener('dragstart', () => {
    lowQualityDuringInteraction(map);
  });

  map.addListener('idle', () => {
    restoreQualityAfterInteraction(map);
  });

  // バッテリー状態のモニタリング（利用可能な場合）
  if ('getBattery' in navigator) {
    monitorBatteryForRendering();
  }
}

// バッテリー状態に応じたレンダリング調整
async function monitorBatteryForRendering(): Promise<void> {
  try {
    // @ts-ignore - getBatteryはWeb標準だが、TypeScriptの型定義が不足している場合がある
    const battery = await navigator.getBattery();

    if (battery.level < 0.15 && !battery.charging) {
      logger.info('バッテリー残量が少ないため、省電力モードに切り替えます', {
        component: 'MapOptimization',
        action: 'low_battery_optimization',
        batteryLevel: battery.level,
      });

      // グローバル設定で省電力モードを有効化
      window.MAP_CONFIG.powerSavingMode = true;

      // マップに適用（マップインスタンスがある場合）
      if (window.currentMap) {
        enableBatterySavingMode(window.currentMap);
      }
    }

    // バッテリー状態の変化を監視
    battery.addEventListener('levelchange', () => {
      // バッテリーレベルに応じて設定を更新
      updateRenderingBasedOnBattery(battery);
    });

    battery.addEventListener('chargingchange', () => {
      // 充電状態に応じて設定を更新
      updateRenderingBasedOnBattery(battery);
    });
  } catch (error) {
    logger.warn('バッテリー状態の取得に失敗しました', {
      component: 'MapOptimization',
      action: 'battery_api_error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
```
