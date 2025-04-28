# 11. スタイリングと設定の互換性

## 静的ホスティング環境におけるスタイリング戦略

```typescript
// 静的ホスティング環境に最適化されたマップスタイリング設定
export function configureMapStyling(
  map: google.maps.Map,
  options: StylingOptions = {}
): void {
  // 前提：環境変数からのmapID取得
  const mapId = ENV.google.mapId;

  // 静的ホスティング環境における最適化
  const isStaticHosting = isStaticHostingEnvironment();

  if (mapId && !isStaticHosting) {
    // Cloud Consoleで設計したスタイルを使用する場合（動的環境）
    map.mapId = mapId;
    logger.info('Cloud Consoleで設計されたMapIDスタイルを適用します', {
      component: 'MapStyling',
      mapId,
    });

    // 補足的なスタイルのみを追加（競合しない要素のみ）
    const supplementalStyles = getSupplementalStyles();
    map.setOptions({ styles: supplementalStyles });
  } else {
    // 静的ホスティング環境またはmapIdがない場合は完全なインラインスタイルを適用
    logger.info(
      `インラインスタイル設定を適用します ${isStaticHosting ? '(静的ホスティング最適化)' : ''}`,
      {
        component: 'MapStyling',
        isStaticHosting,
      }
    );

    // 静的ホスティング用に最適化されたスタイルを適用
    map.setOptions({
      styles: isStaticHosting
        ? STATIC_HOSTING_OPTIMIZED_STYLES
        : SADO_ISLAND_CUSTOM_STYLES,
    });

    // 静的ホスティング環境向けの追加最適化
    if (isStaticHosting) {
      optimizeStylesForStaticHosting(map);
    }
  }
}

// 静的ホスティング環境向けの最適化スタイル
export const STATIC_HOSTING_OPTIMIZED_STYLES = [
  // 基本的なスタイル定義
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ visibility: 'simplified' }],
  },

  // 不要な要素を非表示にしてレンダリングを最適化
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // テクスチャとアイコンを簡素化
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },

  // 佐渡島の海岸線を強調
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#a3ccff' }],
  },

  // 主要道路を強調（ユーザビリティ向上）
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffaa00' }, { weight: 2 }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }], // 道路アイコンを非表示
  },
];

// 静的ホスティング環境向けスタイル最適化
function optimizeStylesForStaticHosting(map: google.maps.Map): void {
  // APIコール削減のための設定
  map.setOptions({
    // 不要な詳細情報を制限
    disableDefaultUI: true,
    zoomControl: true,
    fullscreenControl: true,

    // ストリートビュー・回転操作を無効化（APIリクエスト削減）
    rotateControl: false,
    streetViewControl: false,

    // タイルの読み込みを最適化
    tilt: 0, // 2Dモードに固定
  });

  // プリフェッチとキャッシュ
  if ('caches' in window) {
    prefetchCriticalTiles();
  }
}

// mapIdとインラインスタイルの競合を避けるベストプラクティス（静的ホスティング対応）
export const STYLE_COMPATIBILITY_RECOMMENDATIONS = {
  // 静的ホスティングでmapIdを使う場合の推奨事項
  staticHostingWithMapId: [
    '• 静的ホスティング環境では、インラインスタイルが優先推奨（API利用削減）',
    '• mapIdを使う場合は、適切なキャッシュ戦略と組み合わせる',
    '• リクエスト数を減らすため、詳細度の低いスタイルを選択する',
  ],

  // インラインスタイルを使う場合の推奨事項（静的ホスティング向け）
  staticHostingWithInlineStyles: [
    '• すべてのスタイルをコード内で管理し、不要な詳細・アイコンを非表示に',
    '• APIリクエストを削減するため、ポリゴン単純化と詳細度調整を活用',
    '• 静的ホスティングに最適化された簡素なスタイル定義を使用',
  ],

  // ハイブリッドアプローチ
  hybrid: [
    '• mapIdをベースとして使用し、特定の状況下で限定的なスタイルを上書き',
    '• 静的ホスティング環境では、常に負荷とパフォーマンスを考慮した設計を',
    '• 開発時は詳細なスタイル、本番では簡素化したスタイルを使い分ける',
  ],
};

// 実装例：季節によるスタイル変更（静的ホスティング最適化版）
export function applySeasonalThemeWithStaticHosting(map: google.maps.Map) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const isStaticHosting = isStaticHostingEnvironment();

  // 季節スタイル適用戦略
  if (isStaticHosting) {
    // 静的ホスティングではプリロードされたスタイル定義を使用
    const seasonalStyle = getPreloadedSeasonalStyle(month);
    map.setOptions({ styles: seasonalStyle });

    logger.debug('静的ホスティング用の季節スタイルを適用しました', {
      component: 'SeasonalTheme',
      season: getSeasonName(month),
      styleElements: seasonalStyle.length,
    });
  } else {
    // 通常環境では季節別mapIdまたはフルスタイリング
    const mapId = ENV.google.mapId;

    // 季節ごとに異なるmapIdを使い分ける
    if (month >= 3 && month <= 5 && ENV.google.springMapId) {
      // 春用のmapId
      map.mapId = ENV.google.springMapId;
    } else if (month >= 6 && month <= 8 && ENV.google.summerMapId) {
      // 夏用のmapId
      map.mapId = ENV.google.summerMapId;
    } else if (mapId) {
      // デフォルトのmapId
      map.mapId = mapId;

      // 補足的な季節スタイルを適用
      const seasonalOverrides = getSeasonSpecificOverrides(month);
      if (seasonalOverrides.length > 0) {
        map.setOptions({ styles: seasonalOverrides });
      }
    } else {
      // mapIdがない場合は季節に応じたフルスタイル
      applySadoSeasonalTheme(map);
    }
  }
}
```

## 2025年4月時点の最新情報

2025年4月現在、Google Maps Platform APIではmapIdを使用したスタイリングが推奨アプローチとなっています。mapIdを使用すると以下のメリットがあります：

1. **パフォーマンスの向上**: 事前にコンパイルされたスタイルによる描画速度の向上
2. **管理の容易さ**: Cloud Consoleでの視覚的なスタイル編集
3. **デプロイの簡易化**: コードを変更せずにスタイル更新が可能
4. **アセット管理の統合**: マップスタイルを他のGCP資産と一元管理
5. **ライトモード・ダークモード対応**: ユーザーの環境設定に基づく自動スタイル切替
6. **地域最適化スタイル**: 佐渡島のような特定地域向けの最適化が容易

### 最新のCloud Consoleスタイリング機能

Google Cloud Consoleの地図スタイリングツールでは、以下の新機能が利用可能になっています：

- **テンプレートライブラリ**: 目的別に最適化された地図スタイルテンプレート
- **季節テーマ**: 春夏秋冬に合わせたスタイル設定
- **ダイナミックスタイル**: 時間帯や天候に応じた自動スタイル変更
- **地域特化スタイル**: 特定の地域（例：佐渡島）に最適化されたスタイル設定

当プロジェクトでは、以下のアプローチを推奨します：

```typescript
// 推奨アプローチ：目的別にmapIdを使い分ける
const MAP_IDS = {
  default: ENV.google.mapId, // 標準表示用
  accessible: ENV.google.accessibleMapId, // 高コントラスト版
  satellite: ENV.google.satelliteMapId, // 衛星写真ベース
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
