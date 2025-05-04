# 9. セキュリティ対策

> **最終更新日**: 2025年4月28日  
> **バージョン**: 2.0  
> **作成者**: 佐渡で食えっちゃプロジェクトチーム  
> **重要度**: 高

## 目次

- [静的ホスティング環境向けAPIキー保護](#静的ホスティング環境向けapiキー保護)
- [2025年版強化セキュリティ対策](#2025年版強化セキュリティ対策)
- [静的ホスティングのセキュリティ強化](#静的ホスティングのセキュリティ強化)
- [トークンベースの認証実装](#トークンベースの認証実装)
- [XSS対策](#xss対策)
- [APIキーの制限と使用量モニタリング](#apiキーの制限と使用量モニタリング)

## 静的ホスティング環境向けAPIキー保護

```typescript
// 静的ホスティング環境でのAPIキーセキュリティ対策
export function setupSecureApiKey(): void {
  const apiKey = ENV.google.apiKey;

  // APIキー保護の検証
  if (!ENV.google.apiKeyRestrictions) {
    logger.warn('APIキーにHTTPリファラ制限が設定されていない可能性があります', {
      component: 'SecurityCheck',
      action: 'api_key_security_warning',
    });

    // 静的ホスティング環境向けのセキュリティアドバイス
    logger.warn(
      '静的ホスティング環境では、以下の制限を設定することを強く推奨します:',
      {
        component: 'SecurityCheck',
        recommendedRestrictions: [
          'HTTPリファラ制限 (例: *.github.io/* またはホスティングドメイン)',
          'APIの使用制限 (Maps JavaScript API、Places APIなど必要なAPIのみ)',
          'リクエスト割当量の設定',
          'キーローテーションの定期実施',
        ],
      }
    );
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
}
```

## 2025年版強化セキュリティ対策

```typescript
// 2025年の最新セキュリティ対策を実装（静的ホスティング環境に最適化）
function setupEnhancedSecurity(): void {
  // APIキーの保護
  setupSecureApiKey();

  // 最新のCSP設定を適用
  applySecureCSPPolicy();

  // インラインスクリプト保護
  protectInlineScripts();

  // アクセストークンの保存場所を最適化
  setupSecureTokenStorage();

  // 外部コンテンツの検証
  verifyCrossOriginContent();
}

// 2025年推奨のCSP設定（静的ホスティング対応）
function applySecureCSPPolicy(): void {
  // CSPヘッダーが既に存在するか確認
  const existingCSP = document.querySelector(
    'meta[http-equiv="Content-Security-Policy"]'
  );
  if (existingCSP) {
    return; // 既存のCSPを優先
  }

  // GitHub Pages等の静的ホスティング向けCSP設定（2025年版）
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
    "form-action 'self'; " +
    // 2025年の新しいCSP指示
    "navigate-to 'self' https://*.google.com; " + // 静的ホスティングからのナビゲーション許可
    "webrtc 'block'; " +
    "worker-src 'self'; ";

  // CSPメタタグを作成
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = cspContent;

  // ヘッドに追加
  document.head.appendChild(meta);

  logger.info('静的ホスティング向け最適化CSPポリシーが適用されました', {
    component: 'SecurityEnforcement',
    action: 'static_hosting_csp_applied',
  });
}

// APIキーのリファラ保護を検証するユーティリティ
function validateApiKeyRestrictions(): boolean {
  try {
    // 現在のリファラが制限に含まれているか確認するテスト
    fetch(
      `https://maps.googleapis.com/maps/api/js?key=${ENV.google.apiKey}&callback=initMap&libraries=places&v=weekly&testingreferer=true`,
      { method: 'HEAD' }
    )
      .then(response => {
        if (response.status === 403) {
          // 403はリファラ制限が正しく機能している可能性が高い
          logger.info('APIキーのリファラ制限が正しく機能しています', {
            component: 'SecurityCheck',
            action: 'api_key_restriction_check',
            status: 'working',
          });
          return true;
        } else {
          // 200などのステータスはリファラ制限が効いていない可能性がある
          logger.warn(
            'APIキーのリファラ制限が正しく設定されていない可能性があります',
            {
              component: 'SecurityCheck',
              action: 'api_key_restriction_check',
              status: 'warning',
            }
          );
          return false;
        }
      })
      .catch(() => {
        // ネットワークエラー等の場合は判定不能
        return false;
      });
  } catch (error) {
    return false;
  }

  return true;
}
```

## 静的ホスティングのセキュリティ強化

```typescript
// 静的ホスティング環境における攻撃対策
function setupStaticHostingSecurityMeasures(): void {
  // 1. APIキー使用をモニタリング
  setupApiKeyUsageMonitoring();

  // 2. 静的ホスティングに適した認証方法を使用
  setupStaticHostingFriendlyAuth();

  // 3. ローカルストレージの暗号化
  setupEncryptedLocalStorage();

  // 4. クリックジャッキング対策
  setupFrameProtection();

  // 5. XSS対策（特にマーカーの動的コンテンツ生成）
  sanitizeDynamicMarkerContent();
}

// マーカーの動的コンテンツサニタイズ
function sanitizeDynamicMarkerContent(content: string): string {
  // DOMPurifyなどのライブラリを使用してサニタイズ
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['div', 'span', 'b', 'i', 'img'],
    ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'aria-label', 'role'],
    USE_PROFILES: { html: true },
  });
}

// SRI属性をチェック
function verifySRIAttributes(): void {
  const mapsScripts = document.querySelectorAll(
    'script[src*="maps.googleapis.com"]'
  );

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
```

## トークンベースの認証実装

```typescript
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

## セキュリティ対策のまとめ

Google Maps静的ホスティング環境でのセキュリティ対策は、以下のポイントが重要です：

1. **APIキーの保護**

   - HTTPリファラ制限の設定
   - 使用するAPIの制限
   - 使用量の上限設定

2. **コンテンツセキュリティ**

   - 適切なCSP（Content Security Policy）の設定
   - SRI（Subresource Integrity）の実装
   - XSS対策の徹底

3. **認証と認可**

   - トークンベースの認証の安全な実装
   - トークンの安全な保存と更新

4. **モニタリングと監視**
   - API使用量の定期的な監視
   - 異常検知とアラートの設定

## セキュリティチェックリスト

静的ホスティング環境でGoogle Mapsを実装する前に、以下のチェックリストを確認しましょう：

- [ ] APIキーにHTTPリファラ制限が適切に設定されている
- [ ] 必要なGoogle Maps APIのみが使用可能に制限されている
- [ ] CSPが適切に設定され、必要なドメインのみが許可されている
- [ ] SRIハッシュ値がスクリプト要素に設定されている
- [ ] 動的コンテンツ（InfoWindow等）のサニタイズ処理が実装されている
- [ ] API使用量のモニタリングが設定されている
- [ ] セキュリティアップデートの定期的な適用体制がある

## 関連ドキュメント

- [パフォーマンス最適化ガイドライン](./07_performance.md) - セキュリティとパフォーマンスの両立
- [静的ホスティングガイドライン](../static_hosting_guidelines.md) - 全体的なホスティング環境の設定
- [チェックリスト](./12_checklist.md) - セキュリティを含む総合的な実装チェックリスト

## 更新履歴

- **2025年4月28日**: CSPとSRIの最新実装方法を追加
- **2025年2月15日**: APIキー保護の推奨設定を更新
- **2024年12月3日**: トークンベース認証の初期実装を追加
