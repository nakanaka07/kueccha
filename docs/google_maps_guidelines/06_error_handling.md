# 6. エラー処理とフォールバック戦略

## API読み込み失敗時の対応

```typescript
// API読み込み失敗時の対応例
const handleApiLoadError = (error: unknown): void => {
  logger.error('Google Maps APIのロードに失敗しました', {
    component: 'MapContainer',
    action: 'api_load_error',
    error: error instanceof Error ? error.message : String(error),
  });

  // 静的地図画像へのフォールバック
  showStaticMapImage();

  // ユーザーへの通知
  showErrorNotification('地図の読み込みに失敗しました。再試行してください。');

  // 再試行オプションの提供
  offerRetryButton(() => {
    reloadMapsApi();
  });

  // 2025年推奨：エラー分析と段階的回復
  analyzeAndRecoverFromError(error);
};

// 2025年推奨：エラーの原因を分析して最適な回復を試みる
function analyzeAndRecoverFromError(error: unknown): void {
  // エラータイプの分析
  const errorType = determineErrorType(error);

  switch (errorType) {
    case 'NETWORK_ERROR':
      // ネットワーク接続の問題
      attemptOfflineMapFallback();
      scheduledReconnectionAttempt();
      break;
    case 'API_KEY_ERROR':
      // APIキーの問題（無効、制限など）
      notifyAdminAboutKeyIssue();
      useDegradedMapExperience();
      break;
    case 'SCRIPT_LOAD_ERROR':
      // スクリプト読み込みの失敗
      attemptAlternativeScriptLoad();
      break;
    case 'QUOTA_EXCEEDED':
      // 使用量クォータ超過
      useDegradedMapExperience();
      logQuotaExceededEvent();
      break;
    default:
      // その他の不明なエラー
      useGenericMapFallback();
  }

  // 段階的な機能復旧のスケジュール設定
  scheduleFeatureRecoveryAttempt();
}
```

## マーカーライブラリ未対応時の代替実装

```typescript
// マーカーライブラリ未対応時のフォールバック
function createMarker(
  poi: PointOfInterest
): google.maps.marker.AdvancedMarkerElement | google.maps.Marker {
  try {
    // Advanced Markerを試みる
    if (
      typeof google.maps.marker !== 'undefined' &&
      'AdvancedMarkerElement' in google.maps.marker
    ) {
      return createAdvancedMarker(poi);
    }
  } catch (error) {
    logger.warn(
      'Advanced Markerの作成に失敗しました。従来のMarkerを使用します',
      {
        component: 'MapMarkers',
        action: 'fallback_to_legacy_marker',
        poiId: poi.id,
      }
    );
  }

  // 従来のMarkerへフォールバック
  return createLegacyMarker(poi);
}
```

## 回復と再試行メカニズム

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
        logger.info(
          `操作に失敗しました。${delayMs}ms後に再試行します (${attempt}/${maxRetries})`,
          {
            component: 'RetryHandler',
            action: 'retry_operation',
            error: error instanceof Error ? error.message : String(error),
            attempt,
            maxRetries,
          }
        );

        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  });
}
```
