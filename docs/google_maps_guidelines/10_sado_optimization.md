# 10. 佐渡島固有の最適化

## 静的ホスティング対応の佐渡島最適化

```typescript
// 静的ホスティング向け佐渡島地域特化マップ設定
export const SADO_ISLAND_MAP_OPTIONS = {
  center: { lat: 38.0413, lng: 138.3689 }, // 佐渡島の中心
  zoom: 10, // 島全体が見える程度
  minZoom: 7, // 過度なズームアウトを制限してAPIリクエスト削減
  maxZoom: 18, // 詳細レベルも適切に制限
  // 佐渡島の地図境界を設定
  restriction: {
    latLngBounds: {
      north: 38.4,
      south: 37.6,
      east: 138.8,
      west: 137.9,
    },
    strictBounds: false,
  },
  // 佐渡島の地形を強調表示
  mapTypeId: google.maps.MapTypeId.TERRAIN,
  // 静的ホスティング最適化: 3D表示を無効化
  tilt: 0,
  // カスタムマップスタイル
  styles: SADO_ISLAND_CUSTOM_STYLES,
  // 不要なPOIを非表示にして表示を最適化
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

// 佐渡島の地域に合わせたカスタムスタイル（静的ホスティング最適化版）
export const SADO_ISLAND_CUSTOM_STYLES = [
  {
    // 佐渡島の海岸線を強調
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#a3ccff' }],
  },
  {
    // 佐渡の山地を視覚的に識別しやすく
    featureType: 'landscape.natural.landcover',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c5dea6' }, { saturation: 30 }],
  },
  {
    // 主要道路を強調
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffaa00' }, { weight: 3 }],
  },
  {
    // 不要なPOIアイコンを削減（APIリクエスト低減）
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
];
```

## 佐渡島データのプリロード

```typescript
// 佐渡島の地理データをプリロードして静的ホスティング環境でのパフォーマンスを向上
export async function preloadSadoIslandData(): Promise<void> {
  try {
    // 1. 佐渡島の主要エリアデータをロード
    const areaData = await loadAreaData();

    // 2. ローカルストレージにキャッシュ
    cacheAreasToLocalStorage(areaData);

    // 3. POIデータをロード
    const poiData = await loadStaticPOIData();

    // 4. ジオコーディング結果をプリロード
    await precacheGeocodingResults();

    logger.info('佐渡島データのプリロードが完了しました', {
      component: 'SadoDataLoader',
      areaCount: areaData.length,
      poiCount: poiData.length,
    });

    return { areaData, poiData };
  } catch (error) {
    logger.error('佐渡島データのプリロードに失敗しました', {
      component: 'SadoDataLoader',
      error: error instanceof Error ? error.message : String(error),
    });

    // ローカルキャッシュから回復を試みる
    return recoverFromLocalCache();
  }
}

// 佐渡島の重要エリアデータを定義（静的ホスティング用）
export const SADO_KEY_AREAS = [
  {
    name: '両津・相川地区',
    bounds: {
      north: 38.32,
      south: 38.03,
      east: 138.51,
      west: 138.23,
    },
    zoomLevel: 12,
    poiCategories: ['港', 'レストラン', '観光名所', '宿泊施設'],
  },
  {
    name: '金井・佐和田・新穂・畑野・真野地区',
    bounds: {
      north: 38.08,
      south: 37.94,
      east: 138.4,
      west: 138.26,
    },
    zoomLevel: 13,
    poiCategories: ['レストラン', '観光名所', 'スナック'],
  },
  {
    name: '赤泊・羽茂・小木地区',
    bounds: {
      north: 37.96,
      south: 37.8,
      east: 138.31,
      west: 138.16,
    },
    zoomLevel: 13,
    poiCategories: ['レストラン', '観光名所', '港'],
  },
];
```

## 日本語地図表示の最適化

```typescript
// 日本語表示の最適化（静的ホスティング対応）
export function optimizeJapaneseMapDisplay(map: google.maps.Map) {
  // 日本語フォントの最適化
  const japaneseOptimizedStyles = [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#212121' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }, { weight: 2 }],
    },
    {
      // 地名の表示を最適化
      featureType: 'administrative.locality',
      elementType: 'labels.text',
      stylers: [{ visibility: 'on' }, { weight: 1 }],
    },
  ];

  // 地図の言語を日本語に設定
  map.setOptions({
    styles: [...(map.get('styles') || []), ...japaneseOptimizedStyles],
    language: 'ja',
  });

  // フォント読み込みの最適化
  loadOptimizedJapaneseFonts();
}

// 日本語フォントの最適化読み込み
function loadOptimizedJapaneseFonts(): void {
  // 必要なフォントのみをプリロード
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);

  // スタイルシートも追加
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = fontLink.href;
  document.head.appendChild(styleLink);
}
```

## 季節イベント対応（静的ホスティング最適化）

```typescript
// 佐渡島の季節イベント対応（静的ホスティング最適化版）
export function applySadoSeasonalTheme(map: google.maps.Map) {
  // 現在の季節を取得
  const { season, events } = getCurrentSadoSeason();

  // 季節に応じたスタイル変更
  let seasonalStyle = [];

  switch(season) {
    case 'spring': // 春（3-5月）- 佐渡の桜
      seasonalStyle = SADO_SPRING_STYLES;
      break;
    case 'summer': // 夏（6-8月）- 海水浴シーズン
      seasonalStyle = SADO_SUMMER_STYLES;
      break;
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
    styles: [...currentStyles, ...seasonalStyle],
  });
}

// 春のスタイル例（桜の時期）
const SADO_SPRING_STYLES = [
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffeeff' }, { saturation: 20 }],
  },
];
```

## 地域特化機能の活用

```typescript
// 佐渡島の主要な観光スポットと施設を強調表示
function enhanceSadoPointsOfInterest(map: google.maps.Map) {
  // 主要な観光スポットのカテゴリーを強調表示
  const pointsOfInterestStyles = [
    {
      // 佐渡の歴史的建造物（寺社仏閣、史跡など）を強調
      featureType: 'poi.attraction',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }, { weight: 2 }],
    },
    {
      // 島内の主要道路の標識を見やすく
      featureType: 'road.arterial',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }, { weight: 1.5 }],
    },
    {
      // 佐渡の自然公園を強調
      featureType: 'poi.park',
      elementType: 'geometry.fill',
      stylers: [{ visibility: 'on' }, { saturation: 40 }],
    },
  ];

  map.setOptions({
    styles: [...(map.get('styles') || []), ...pointsOfInterestStyles],
  });
}

// 佐渡島特有のランドマークをマップに追加
function addSadoLandmarks(map: google.maps.Map) {
  // 主要ランドマークの座標とラベル
  const landmarks = [
    { position: { lat: 38.2147, lng: 138.3242 }, name: '尖閣湾' },
    { position: { lat: 38.0342, lng: 138.2328 }, name: '佐渡金山' },
    { position: { lat: 37.8157, lng: 138.2681 }, name: '小木港' },
    // 必要に応じて追加
  ];

  // 2025年版の拡張機能を使ったランドマーク表示
  landmarks.forEach(landmark => {
    if (
      typeof google.maps.marker !== 'undefined' &&
      'AdvancedMarkerElement' in google.maps.marker
    ) {
      // Advanced Markerを使用
      const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
        position: landmark.position,
        title: landmark.name,
        map: map,
        // ランドマークを他のマーカーより上に表示
        zIndex: 1000,
        content: (() => {
          // カスタムランドマークピン
          const pinOptions = {
            background: '#4285F4',
            borderColor: '#FFF',
            glyphColor: '#FFF',
            glyph: '★',
            scale: 1.2,
            borderRadius: '50%', // 2025年の新機能を活用
          };
          return new google.maps.marker.PinElement(pinOptions).element;
        })(),
      });
    } else {
      // 従来のマーカーにフォールバック
      new google.maps.Marker({
        position: landmark.position,
        map: map,
        title: landmark.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFF',
          strokeWeight: 2,
          scale: 8,
        },
      });
    }
  });
}

// 佐渡島のルートと経路を最適化
function optimizeSadoRoutes(map: google.maps.Map) {
  // 主要な観光ルートを地図上に表示
  const touristRoutes = [
    [
      { lat: 38.0342, lng: 138.2328 }, // 佐渡金山
      { lat: 38.0413, lng: 138.3689 }, // 中心部
      { lat: 38.2147, lng: 138.3242 }, // 尖閣湾
    ],
    [
      { lat: 37.8157, lng: 138.2681 }, // 小木港
      { lat: 37.9136, lng: 138.2747 }, // 宿根木
      { lat: 38.0342, lng: 138.2328 }, // 佐渡金山
    ],
  ];

  // ルートの描画
  touristRoutes.forEach((path, index) => {
    const route = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: index === 0 ? '#FF0000' : '#0000FF',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: map,
    });

    // ルートの説明ラベルを追加（2025年のAPI機能を活用）
    if (path.length > 0) {
      const midpoint = path[Math.floor(path.length / 2)];
      const label = new google.maps.marker.AdvancedMarkerElement({
        position: midpoint,
        map: map,
        content: (() => {
          const div = document.createElement('div');
          div.className = 'route-label';
          div.textContent = `観光ルート ${index + 1}`;
          div.style.backgroundColor = 'white';
          div.style.padding = '3px 6px';
          div.style.border = '1px solid #ccc';
          div.style.borderRadius = '4px';
          return div;
        })(),
      });
    }
  });
}
```
