# 2. API初期化とライフサイクル管理

## 初期化プロセスの標準パターン

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

## 環境変数の設定と検証

```typescript
// 環境変数検証の標準パターン
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

## ライブラリの効率的なロード戦略

- **必要なライブラリのみロード**: `maps`、`marker`など必要最小限のライブラリを指定
- **遅延ロード**: マップが実際に必要になるタイミングでロード
- **バージョン管理**: APIバージョンを環境変数で一元管理
- **最新APIのサポート**: Maps JavaScript API v3.54以降の機能を活用

```typescript
// ライブラリ指定の例（2025年の最新API対応）
const REQUIRED_LIBRARIES = [
  'maps',
  'marker',
  'places',
  'webgl',
  'localcontext',
];

export const getLoaderOptions = (): LoaderOptions => {
  return {
    apiKey: ENV.google.apiKey,
    version: ENV.google.mapsVersion || 'weekly', // 最新機能を常に利用可能に
    libraries: REQUIRED_LIBRARIES,
    mapIds: (() => {
      // 基本マップIDと目的別マップIDを統合
      const mapIds = [];
      if (ENV.google.mapId) mapIds.push(ENV.google.mapId);
      if (ENV.google.accessibleMapId) mapIds.push(ENV.google.accessibleMapId); // アクセシビリティ用
      if (ENV.google.darkModeMapId) mapIds.push(ENV.google.darkModeMapId); // ダークモード用
      // 季節別のマップID
      const seasonalMapIds = [
        ENV.google.springMapId,
        ENV.google.summerMapId,
        ENV.google.autumnMapId,
        ENV.google.winterMapId,
      ].filter(Boolean);
      return [...mapIds, ...seasonalMapIds];
    })(),
    // 2025年の新しいセキュリティ対策と最適化
    authReferrerPolicy: 'origin',
    useStaticMap: true, // 初期表示を高速化
    language: 'ja', // 日本語表示を最適化
    region: 'JP', // 日本向けの地域設定
    channel: 'sado-tourism-app', // 使用量トラッキング用
  };
};
```

## エラーハンドリングとリカバリー戦略

```typescript
// マップ読み込みエラーのハンドリング
try {
  await loadMapsApi(loaderOptions, apiKey);
} catch (error) {
  logger.error('Google Maps APIのロードに失敗しました', {
    component: 'useGoogleMaps',
    action: 'api_load_error',
    version: loaderOptions.version,
    errorMessage: error instanceof Error ? error.message : String(error),
  });

  // フォールバック機能の提供
  showMapLoadingError();
  attemptToLoadStaticMap();
}
```
