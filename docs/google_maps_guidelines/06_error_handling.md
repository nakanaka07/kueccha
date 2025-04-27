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

## 静的ホスティング環境向けのエラーハンドリング

```typescript
// 静的ホスティング環境で使用するエラー処理とフォールバック
export function setupStaticHostingErrorHandling(
  mapContainerId: string,
  options: ErrorHandlingOptions = {}
): void {
  // 1. オフラインマップのためのリソース準備
  prepareOfflineMapResources();

  // 2. 静的マップ画像のプリロード（API障害時のフォールバック用）
  preloadStaticMapImage();

  // 3. エラー監視とフォールバックの設定
  window.addEventListener(
    'error',
    event => {
      // Google Maps関連のエラーかどうかを判定
      if (isGoogleMapsError(event.error, event.filename)) {
        // エラー発生をログに記録
        logger.error('Google Mapsエラーを検出しました', {
          component: 'ErrorHandler',
          errorMessage: event.message,
          lineNumber: event.lineno,
          fileName: event.filename,
          timestamp: new Date().toISOString(),
        });

        // 代替表示の実装
        implementAlternativeView(mapContainerId, event.error);

        // エラーが伝播しないように処理
        event.preventDefault();
      }
    },
    true
  );

  // 4. APIロードのタイムアウト監視
  const apiLoadTimeout = setTimeout(() => {
    if (!window.google?.maps) {
      logger.warn('Google Maps APIのロードがタイムアウトしました', {
        component: 'ErrorHandler',
        timeoutMs: options.apiLoadTimeoutMs || 15000,
      });

      // タイムアウト時の代替表示
      showApiLoadTimeoutFallback(mapContainerId);
    }
  }, options.apiLoadTimeoutMs || 15000);

  // APIロード成功時にタイムアウト監視をクリア
  const clearTimeoutOnSuccess = () => {
    if (window.google?.maps) {
      clearTimeout(apiLoadTimeout);
      window.removeEventListener('load', clearTimeoutOnSuccess);
    }
  };
  window.addEventListener('load', clearTimeoutOnSuccess);

  // 5. ユーザー主導のリカバリーオプション
  setupManualRecoveryOptions(mapContainerId);
}

// APIエラー発生時の代替表示
function implementAlternativeView(
  containerId: string,
  error: Error | null
): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  // コンテナを空にする
  container.innerHTML = '';

  // エラータイプに基づいた代替コンテンツ
  if (isApiKeyError(error)) {
    renderApiKeyErrorView(container);
  } else if (isNetworkError(error)) {
    renderOfflineMapView(container);
  } else {
    renderGenericErrorView(container);
  }

  // 再試行ボタンの追加
  addRetryButton(container);
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
  initialDelayMs: number = 1000,
  maxDelayMs: number = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const executeOperation = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        attempts++;

        if (attempts >= maxRetries) {
          reject(error);
          return;
        }

        // 指数バックオフでの再試行
        const delayMs = Math.min(
          initialDelayMs * Math.pow(2, attempts - 1),
          maxDelayMs
        );

        logger.debug(`操作を再試行します (${attempts}/${maxRetries})`, {
          component: 'RetryMechanism',
          delayMs,
        });

        // 再試行までの遅延を追加
        setTimeout(executeOperation, delayMs);
      }
    };

    executeOperation();
  });
}
```

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

```
