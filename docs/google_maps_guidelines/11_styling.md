# 11. スタイリングと設定の互換性

## mapIDとカスタムスタイルの関係

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

## 2025年4月時点の最新情報

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
