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
      action: 'api_key_security_warning'
    });
  }
  
  // CSP設定の確認
  const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!metaCSP) {
    logger.warn('Content Security Policyが設定されていません', {
      component: 'SecurityCheck',
      action: 'csp_missing_warning'
    });
  }
  
  return apiKey;
}
```

## XSS対策

```typescript
// XSS対策を含むInfoWindow実装
function createSafeInfoWindow(content: string, poi: PointOfInterest): google.maps.InfoWindow {
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
    maxWidth: 300
  });
}
```
