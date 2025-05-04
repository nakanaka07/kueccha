# 7. パフォーマンス最適化

> **最終更新日**: 2025年4月29日  
> **バージョン**: 2.1  
> **作成者**: 佐渡で食えっちゃプロジェクトチーム  
> **優先度**: 高

## 目次

- [基本的なパフォーマンス最適化戦略](#基本的なパフォーマンス最適化戦略)
- [マーカーの遅延読み込みと表示範囲最適化](#マーカーの遅延読み込みと表示範囲最適化)
- [静的ホスティング環境向けの最適化](#静的ホスティング環境向けの最適化)
- [地図タイルとAPIリソースの最適化](#地図タイルとapiリソースの最適化)
- [メモリ使用量の最適化](#メモリ使用量の最適化)
- [ベクターマップとWebGL処理の活用](#ベクターマップとwebgl処理の活用)
- [デバイス適応型最適化](#デバイス適応型最適化)
- [パフォーマンスチェックリスト](#パフォーマンスチェックリスト)
- [リファレンス](#リファレンス)
- [更新履歴](#更新履歴)

## 基本的なパフォーマンス最適化戦略

Google Maps APIを効率的に使用するための基本戦略：

- **遅延読み込み**: 必要なときに必要なものだけを読み込む
- **リソース最適化**: APIリクエスト数の最小化とキャッシング活用
- **レンダリング最適化**: 表示要素を必要最小限に抑える
- **メモリ管理**: 不要なオブジェクトの適切な破棄

## マーカーの遅延読み込みと表示範囲最適化

マーカーの遅延読み込みは、特に大量のマーカーを扱う場合に効果的です。

```typescript
// マーカーの遅延読み込みのコア実装例
const useMarkerVisibility = ({
  mapRef,
  markers,
  visibilityMargin = 0.5, // 表示領域を50%拡張
  debounceMs = 300,
}) => {
  const [visibleMarkers, setVisibleMarkers] = useState<typeof markers>([]);

  // 表示範囲の計算を最適化（debounce処理）
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

      // パフォーマンスメトリクスを記録（オプション）
      logger.debug('マーカー表示最適化', {
        totalMarkers: markers.length,
        visibleMarkers: newVisibleMarkers.length,
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
```

主要なポイント：

- 現在の地図表示範囲に基づきマーカーをフィルタリング
- 移動やズームの操作が完了した後に更新（debounce処理）
- 表示範囲を少し拡張して、スムーズなスクロール体験を提供

## 静的ホスティング環境向けの最適化

静的ホスティング環境でのパフォーマンス最適化は特に重要です。

```typescript
// 静的ホスティング環境でのパフォーマンス最適化策
export function optimizeForStaticHosting(map: google.maps.Map): void {
  // 1. API呼び出し回数を最小化するための設定
  map.setOptions({
    clickableIcons: false, // Google POIのクリックを無効化
    disableDefaultUI: true, // 不要なUIコントロールを無効化
    zoomControl: true, // 必要なUIのみ有効化
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  // 2. キャッシュ戦略の最適化（可能な場合）
  if ('cacheStorage' in window) {
    precacheCriticalMapAssets();
  }

  // 3. タイルロード戦略の最適化
  const sadoIslandBounds = getSadoIslandBounds();
  prefetchPriorityMapTiles(sadoIslandBounds, [9, 10, 11]);

  // 4. WebWorkerでの処理を活用（可能な場合）
  if (window.Worker) {
    setupMarkerProcessingWorker();
  }

  // 5. レンダリングのパフォーマンス監視
  setupRenderingPerformanceMonitoring(map);
}
```

主要なポイント：

- 不必要なAPIリクエストを減らすUI設定
- 重要なアセットの事前キャッシュ
- 主要な地図タイルの事前読み込み
- バックグラウンド処理のためのWeb Workerの活用

## 地図タイルとAPIリソースの最適化

地図リソースの読み込みを最適化することでパフォーマンスを向上させられます。

```typescript
// 最適化されたマップ初期化オプション
const DEFAULT_MAP_OPTIONS = {
  center: { lat: 38.0413, lng: 138.3689 }, // 佐渡島の中心
  zoom: 10, // 島全体が見える程度
  minZoom: 7, // 過度にズームアウトを制限
  maxZoom: 18, // ズームインも適切に制限
  restriction: {
    latLngBounds: getSadoIslandBounds().toJSON(),
    strictBounds: false, // 少しの余裕を持たせる
  },
  useStaticMap: true, // 初期表示を高速化
};

// 佐渡島の地図範囲を取得する関数
function getSadoIslandBounds(): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    { lat: 37.6, lng: 137.9 }, // 南西
    { lat: 38.4, lng: 138.8 } // 北東
  );
}
```

主要なポイント：

- 佐渡島に関連する領域にマップの表示範囲を限定
- ズームレベルを適切に制限
- 静的マップを活用した初期表示の高速化

## メモリ使用量の最適化

メモリリークを防ぐため、不要になったマーカーやイベントリスナーを適切にクリーンアップします。

```typescript
// マーカーとイベントリスナーのクリーンアップ
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

// Reactコンポーネントでのクリーンアップ例
useEffect(() => {
  return () => {
    cleanupMarkers(currentMarkers, currentClusterer);
  };
}, []);
```

主要なポイント：

- イベントリスナーの明示的な削除
- マーカーをマップから適切に削除
- マーカークラスタラーの適切なクリーンアップ

## ベクターマップとWebGL処理の活用

2025年の最新APIではWebGLとベクターマップを活用することで、パフォーマンスを大幅に向上できます。

```typescript
// WebGLとベクターマップの最適化設定
function setupOptimizedVectorMap(map: google.maps.Map): void {
  // マップの機能をチェック
  const capabilities = map.getMapCapabilities();

  if (capabilities.isVectorMapAvailable) {
    // ベクターマップ専用の最適化設定
    // @ts-ignore - 2025年の新API対応
    map.setVectorOptions({
      // ベクターデータの詳細レベル
      vectorDetail: 'high', // high, medium, low

      // 視覚的なエフェクト設定
      visualEffects: {
        buildingRenderMode: '3d-simplified',
        terrainRenderMode: 'optimized',
        roadDetail: 'medium',
      },
    });

    // 環境に応じた適応型レンダリング
    setupAdaptiveRendering(map);
  } else {
    // ラスターマップのフォールバック設定
    setupRasterMapOptimizations(map);
  }
}

// インタラクション中のパフォーマンス最適化
function setupAdaptiveRendering(map: google.maps.Map): void {
  // マップドラッグ中は詳細度を下げる
  map.addListener('dragstart', () => {
    if (map.getMapCapabilities().isVectorMapAvailable) {
      // @ts-ignore - 2025年の新API対応
      map.setVectorOptions({ vectorDetail: 'low', roadDetail: 'low' });
    }
  });

  // インタラクション完了後に品質を戻す
  map.addListener('idle', () => {
    if (map.getMapCapabilities().isVectorMapAvailable) {
      // @ts-ignore - 2025年の新API対応
      map.setVectorOptions({ vectorDetail: 'medium', roadDetail: 'medium' });
    }
  });
}
```

主要なポイント：

- ベクターマップのサポート検出と最適な設定
- インタラクション中の一時的な詳細度低減
- APIの互換性を考慮したフォールバック設定

## デバイス適応型最適化

デバイスのパフォーマンスやバッテリー状態に応じて最適化を適用します。

```typescript
// デバイスのパフォーマンスに応じた最適化
function setupDeviceAdaptiveOptimizations(map: google.maps.Map): void {
  // デバイス情報を取得
  const deviceInfo = getDevicePerformanceProfile();

  // 低性能デバイスの場合
  if (deviceInfo.performanceLevel === 'low') {
    enableBatterySavingMode(map);
  }

  // バッテリー状態のモニタリング（利用可能な場合）
  if ('getBattery' in navigator) {
    monitorBatteryForAdaptiveRendering(map);
  }
}

// バッテリー節約モードの有効化
function enableBatterySavingMode(map: google.maps.Map): void {
  // フレームレートの制限
  window.MAP_CONFIG.maxFrameRate = 30;

  // アニメーションの無効化
  window.MAP_CONFIG.enableAnimations = false;

  // 詳細度の低減
  if (map.getMapCapabilities().isVectorMapAvailable) {
    // @ts-ignore - 2025年の新API対応
    map.setVectorOptions({ vectorDetail: 'low' });
  }

  // 3D建物の無効化
  map.setOptions({
    styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }],
  });
}
```

主要なポイント：

- デバイスの性能に基づいた最適化設定
- バッテリー状態のモニタリングと適応
- 低バッテリー状態でのレンダリング品質調整

## パフォーマンスチェックリスト

Google Mapsを最適化するための実装チェックリスト：

### マーカーと表示の最適化

- [ ] 表示範囲内のマーカーのみを描画する遅延読み込みを実装
- [ ] マーカークラスタリングを使用して多数のマーカーを効率的に表示
- [ ] マップの移動・ズーム時にマーカー表示を適切に更新
- [ ] アイコンやラベルのアセットをプリロード・キャッシュ

### API使用量の最適化

- [ ] 佐渡島の地域に限定したマップ表示範囲を設定
- [ ] 必要なライブラリのみをロードし不要なAPIの読み込みを回避
- [ ] スクリプトのロードをdefer属性で遅延
- [ ] インタラクション中は低品質レンダリングを適用

### メモリと処理の最適化

- [ ] 不要なマーカーやオーバーレイを適切にクリーンアップ
- [ ] イベントリスナーを明示的に削除
- [ ] リソースを効率的に再利用
- [ ] Web Workersを活用して処理を分散

### 静的ホスティング特有の最適化

- [ ] マップアセットを適切にキャッシュ
- [ ] 高頻度でアクセスする領域のタイルをプリフェッチ
- [ ] レイアウトシフトを防ぐマップコンテナ設計
- [ ] パフォーマンスメトリクスの計測と記録

### デバイス適応型最適化

- [ ] デバイスの性能に応じたレンダリング品質調整
- [ ] バッテリー状態に基づく省電力モードの適用
- [ ] インタラクション中の処理軽減
- [ ] WebGLレンダリングの適切な活用

## リファレンス

### 共通型定義

```typescript
// マップ上の関心地点
interface PointOfInterest {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  tags?: string[];
  priority?: number;
}

// グローバル設定
interface MapConfig {
  powerSavingMode: boolean;
  maxFrameRate: number;
  enableAnimations: boolean;
  defaultStyles?: google.maps.MapTypeStyle[];
}
```

### 主要ヘルパー関数

- **calculateExtendedBounds**: 表示範囲を指定のマージンで拡張する
- **precacheCriticalMapAssets**: 重要なマップアセットをキャッシュする
- **prefetchPriorityMapTiles**: 優先度の高いタイルを先読みする
- **getDevicePerformanceProfile**: デバイスの性能プロファイルを取得する
- **setupMarkerProcessingWorker**: マーカー処理用のWeb Workerを設定する

### 関連リソース

- [アクセシビリティとパフォーマンスの両立](./08_accessibility.md) - アクセシブルかつ高速なマップ実装
- [セキュリティ対策](./09_security.md) - 安全性とパフォーマンスのバランス
- [佐渡島固有の最適化](./10_sado_optimization.md) - 佐渡島向けの特化した最適化技術
- [Google Maps 公式パフォーマンスガイド](https://developers.google.com/maps/documentation/javascript/performance)
- [WebGLレンダリング活用ガイド](https://developers.google.com/maps/documentation/javascript/webgl)

## 更新履歴

- **2025年4月29日**: 冗長な内容を整理し、構成を改善
- **2025年4月28日**: WebGLとベクターマップの最適化セクションを追加
- **2025年2月15日**: バッテリー状態に基づく最適化を追加
- **2024年12月10日**: 初版作成
