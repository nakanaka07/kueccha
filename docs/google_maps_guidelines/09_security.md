# 9. セキュリティ対策

## APIキー保護

```typescript
// APIキーのセキュリティ対策
function setupSecureApiKey(): string {
  const apiKey = ENV.google.apiKey;

  // APIキーが適切に保護されているか確認
  if (!ENV.google.apiKeyRestrictions) {
    logger.warn('APIキーにHTTPリファラ制限が設定されていない可能性があります', {
      component: 'SecurityCheck',
      action: 'api_key_security_warning',
    });
  }

  // CSP設定の確認
  const metaCSP = document.querySelector(
    'meta[http-equiv="Content-Security-Policy"]'
  );
  if (!metaCSP) {
    logger.warn('Content Security Policyが設定されていません', {
      component: 'SecurityCheck',
      action: 'csp_missing_warning',
    });
  }

  return apiKey;
}
```

## 2025年版強化セキュリティ対策

```typescript
// 2025年の最新セキュリティ対策を実装
function setupEnhancedSecurity(): void {
  // APIキーの保護
  setupSecureApiKey();

  // 最新のCSP設定を適用
  applySecureCSPPolicy();

  // Subresource Integrity (SRI) の検証
  verifySRI();

  // トークンベースの認証（2025年の新機能）
  setupTokenBasedAuth();
}

// 2025年推奨のCSP設定
function applySecureCSPPolicy(): void {
  // CSPヘッダーが既に存在するか確認
  const existingCSP = document.querySelector(
    'meta[http-equiv="Content-Security-Policy"]'
  );
  if (existingCSP) {
    return; // 既存のCSPを優先
  }

  // Google Maps API用の現代的なCSP設定（2025年版）
  const cspContent =
    "default-src 'self'; " +
    "script-src 'self' https://*.googleapis.com https://*.gstatic.com; " +
    "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.google.com; " +
    "img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://*.google.com; " +
    "style-src 'self' 'unsafe-inline' https://*.googleapis.com; " +
    "font-src 'self' https://*.gstatic.com; " +
    "frame-src 'self' https://www.google.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';" +
    // 2025年の新しいCSP指示
    "navigate-to 'self'; " +
    "webrtc 'block'; " +
    "worker-src 'self'; " +
    'trusted-types googlemaps default; ' +
    "require-trusted-types-for 'script'";

  // CSPメタタグを作成
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = cspContent;

  // ヘッドに追加
  document.head.appendChild(meta);

  logger.info('セキュアなCSPポリシーが適用されました', {
    component: 'SecurityEnforcement',
    action: 'csp_applied',
  });
}

// SRI検証（外部スクリプトの整合性検証）
function verifySRI(): void {
  // Google Maps APIスクリプト要素を取得
  const mapsScripts = document.querySelectorAll(
    'script[src*="googleapis.com"]'
  );

  // SRI属性をチェック
  mapsScripts.forEach(script => {
    if (!(script instanceof HTMLScriptElement)) return;

    if (!script.integrity) {
      logger.warn('Google Maps スクリプトにSRI属性が設定されていません', {
        component: 'SecurityCheck',
        action: 'sri_missing',
        src: script.src,
      });
    }
  });
}

// トークンベースの認証実装（2025年の新機能）
function setupTokenBasedAuth(): void {
  // APIアクセストークンが設定されているか確認
  if (!ENV.google.apiAccessToken) {
    return;
  }

  // トークンの有効期限を確認
  const tokenExpiry = parseTokenExpiry(ENV.google.apiAccessToken);
  if (tokenExpiry && tokenExpiry < Date.now() + 3600 * 1000) {
    // トークンの有効期限が1時間以内の場合は更新
    scheduleTokenRefresh();
  }

  // トークンリフレッシュのスケジュール設定
  function scheduleTokenRefresh(): void {
    if (tokenExpiry) {
      const timeUntilExpiry = Math.max(
        0,
        tokenExpiry - Date.now() - 600 * 1000
      ); // 期限の10分前
      setTimeout(refreshApiAccessToken, timeUntilExpiry);
    }
  }

  // APIアクセストークンの更新処理
  async function refreshApiAccessToken(): Promise<void> {
    try {
      const response = await fetch('/api/refresh-maps-token', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();

      // 新しいトークンを設定
      ENV.google.apiAccessToken = data.token;

      // 次回の更新をスケジュール
      const newExpiry = parseTokenExpiry(data.token);
      if (newExpiry) {
        const timeUntilNextRefresh = Math.max(
          0,
          newExpiry - Date.now() - 600 * 1000
        );
        setTimeout(refreshApiAccessToken, timeUntilNextRefresh);
      }

      logger.info('Maps APIアクセストークンが更新されました', {
        component: 'Security',
        action: 'token_refreshed',
      });
    } catch (error) {
      logger.error('APIトークンの更新に失敗しました', {
        component: 'Security',
        action: 'token_refresh_error',
        error: error instanceof Error ? error.message : String(error),
      });

      // エラー時は短い間隔で再試行
      setTimeout(refreshApiAccessToken, 60 * 1000);
    }
  }
}

// トークンから有効期限を解析
function parseTokenExpiry(token: string): number | null {
  try {
    // JWTの場合（セキュリティ上の理由で検証せずに読むのみ）
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        return payload.exp * 1000; // UNIX時間（秒）をミリ秒に変換
      }
    }
    return null;
  } catch {
    return null;
  }
}
```

## XSS対策

```typescript
// XSS対策を含むInfoWindow実装
function createSafeInfoWindow(
  content: string,
  poi: PointOfInterest
): google.maps.InfoWindow {
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
    maxWidth: 300,
  });
}
```

## APIキーの制限と使用量モニタリング

```typescript
// APIキーのセキュリティ設定を確認
function verifyApiKeyRestrictions(): boolean {
  // APIキーに設定されているべき制限をチェック
  const requiredRestrictions = [
    'HTTP_REFERRER', // HTTPリファラ制限
    'IP_ADDRESS', // IPアドレス制限（オプション）
  ];

  // 設定されている制限を確認
  const configuredRestrictions = ENV.google.apiKeyRestrictions || [];

  // 必須の制限が設定されているか確認
  const missingRestrictions = requiredRestrictions.filter(
    restriction => !configuredRestrictions.includes(restriction)
  );

  if (missingRestrictions.length > 0) {
    logger.warn('APIキーに推奨される制限が設定されていません', {
      component: 'SecurityCheck',
      action: 'api_key_missing_restrictions',
      missingRestrictions,
    });
    return false;
  }

  return true;
}

// API使用量モニタリングの設定
function setupApiUsageMonitoring(): void {
  // 日次の使用状況レポートをスケジュール
  scheduleUsageReport();

  // 使用量の閾値アラートを設定
  setupUsageThresholdAlerts();

  // API呼び出しの異常検出
  enableAnomalyDetection();
}

// API使用量の閾値アラート設定
function setupUsageThresholdAlerts(): void {
  const THRESHOLDS = {
    WARNING: 0.7, // 予算の70%
    CRITICAL: 0.9, // 予算の90%
  };

  // 現在の使用量を定期的にチェック
  setInterval(async () => {
    try {
      const usageData = await fetchApiUsageStats();
      const usageRatio = usageData.currentUsage / usageData.budget;

      if (usageRatio >= THRESHOLDS.CRITICAL) {
        // 重大アラート - 使用量が予算の90%を超えている
        logger.error('Maps API使用量が予算の90%を超えています！', {
          component: 'ApiUsageMonitor',
          action: 'critical_usage_alert',
          usageRatio,
          currentUsage: usageData.currentUsage,
          budget: usageData.budget,
        });

        // 管理者に通知
        notifyAdmins('CRITICAL_API_USAGE', usageData);
      } else if (usageRatio >= THRESHOLDS.WARNING) {
        // 警告アラート - 使用量が予算の70%を超えている
        logger.warn('Maps API使用量が予算の70%を超えています', {
          component: 'ApiUsageMonitor',
          action: 'warning_usage_alert',
          usageRatio,
          currentUsage: usageData.currentUsage,
          budget: usageData.budget,
        });
      }
    } catch (error) {
      logger.error('API使用量の取得に失敗しました', {
        component: 'ApiUsageMonitor',
        action: 'fetch_usage_error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, 3600 * 1000); // 1時間ごとにチェック
}
```
