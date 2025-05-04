# 8. アクセシビリティとユーザビリティ対応

> **最終更新日**: 2025年4月28日  
> **バージョン**: 2.0  
> **作成者**: 佐渡で食えっちゃプロジェクトチーム  
> **準拠規格**: WCAG 2.2

## 目次

- [スクリーンリーダー対応](#スクリーンリーダー対応)
- [静的ホスティング環境でのアクセシビリティ対応](#静的ホスティング環境でのアクセシビリティ対応)
- [キーボード操作対応](#キーボード操作対応)
- [視覚的ユーザビリティの強化](#視覚的ユーザビリティの強化)
- [高コントラストモードと色覚多様性対応](#高コントラストモードと色覚多様性対応)
- [マップのWCAG 2.2準拠](#マップのwcag-22準拠)
- [アクセシビリティチェックリスト](#アクセシビリティチェックリスト)

## スクリーンリーダー対応

```typescript
// アクセシブルなマーカーの作成
function createAccessibleMarker(
  poi: PointOfInterest
): google.maps.marker.AdvancedMarkerElement {
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name, // スクリーンリーダーで読み上げられるタイトル
    content: (() => {
      const element = document.createElement('div');
      element.className = 'marker';
      element.style.cursor = 'pointer';
      element.style.backgroundImage = `url(${getIconUrl(poi.category)})`;
      element.style.width = '32px';
      element.style.height = '32px';

      // アクセシビリティ属性の追加
      element.setAttribute('role', 'button');
      element.setAttribute(
        'aria-label',
        `${poi.name}、${getCategoryName(poi.category)}、緯度経度 ${poi.lat}、${poi.lng}`
      );
      element.setAttribute('tabindex', '0');

      // キーボード操作のサポート
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          onMarkerClick(poi);
        }
      });

      return element;
    })(),
  });

  return marker;
}
```

## 静的ホスティング環境でのアクセシビリティ対応

````typescript
// 静的ホスティング環境向けのアクセシビリティ機能実装
export function setupAccessibilityForStaticHosting(
  map: google.maps.Map,
  mapContainerId: string = 'map'
): AccessibilityManager {
  // 1. アクセシビリティメッセージの追加
  const mapContainer = document.getElementById(mapContainerId);
  if (!mapContainer) {
    throw new Error(`Map container with id "${mapContainerId}" not found`);
  }

  // スクリーンリーダーのためのヘルプテキスト
  const a11yHelpText = document.createElement('div');
  a11yHelpText.setAttribute('role', 'status');
  a11yHelpText.setAttribute('aria-live', 'polite');
  a11yHelpText.classList.add('sr-only'); // 視覚的に非表示だがスクリーンリーダーには読まれるクラス
  a11yHelpText.id = 'map-a11y-status';
  mapContainer.appendChild(a11yHelpText);

  // 2. キーボードナビゲーション機能
  setupKeyboardNavigation(map, mapContainerId);

  // 3. フォーカス管理とトラップ回避
  setupFocusManagement(mapContainerId);

  // 4. ユーザー設定に応じた表示の最適化
  setupUserPreferenceAdaptations(map);

  // 5. アクセシビリティマネージャーを返却
  return {
    announceToScreenReader: (message: string) => {
      const statusElement = document.getElementById('map-a11y-status');
      if (statusElement) {
        statusElement.textContent = message;
        // 短いタイムアウト後にクリア（スクリーンリーダーに確実に読ませるため）
        setTimeout(() => {
          statusElement.textContent = '';
        }, 3000);
      }
    },

    // その他のアクセシビリティ関連メソッド
    applyHighContrast: () => applyHighContrastMapStyle(map),
    setupReducedMotion: () => setupReducedMotionExperience(map),
    enhanceFeedback: () => enhanceMarkerSelectionFeedback(map),
  };
}

// ユーザー設定に応じた表示の最適化
function setupUserPreferenceAdaptations(map: google.maps.Map): void {
  // カラーコントラスト対応
  if (window.matchMedia('(prefers-contrast: more)').matches) {
    applyHighContrastMapStyle(map);
  }

  // 動きの低減
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setupReducedMotionExperience(map);
  }

  // 拡大表示への対応
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyDarkModeMapStyle(map);
  }
}

## キーボード操作対応

```typescript
// キーボード操作に対応したマップコントロール
function setupKeyboardAccessibility(map: google.maps.Map) {
  // フォーカストラップ対策
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.setAttribute('tabindex', '-1');

    // Escキーでマップからフォーカスを外せるようにする
    mapContainer.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const exitMapButton = document.getElementById('exit-map-button');
        if (exitMapButton) {
          exitMapButton.focus();
        }
      }
    });

    // キーボード操作の視覚的フィードバック
    mapContainer.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
    });

    // マウス使用時の視覚的フィードバック切替
    mapContainer.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  // マップコントロールのアクセシビリティ強化
  const setupA11yForControl = (controlId: string, label: string) => {
    const control = document.getElementById(controlId);
    if (control) {
      control.setAttribute('aria-label', label);
      control.setAttribute('role', 'button');
      control.setAttribute('tabindex', '0');

      // タッチターゲットサイズの拡大（WCAG 2.2 2.5.8 Target Size (minimum)）
      if (control instanceof HTMLElement && window.innerWidth <= 768) {
        control.style.minWidth = '44px';
        control.style.minHeight = '44px';
      }
    }
  };

  // 各コントロールの設定
  setupA11yForControl('zoom-in-button', 'ズームイン');
  setupA11yForControl('zoom-out-button', 'ズームアウト');
  setupA11yForControl('fullscreen-button', '全画面表示切り替え');
}
````

## 視覚的ユーザビリティの強化

```typescript
// 視認性を高めるマップスタイルの設定
function applyAccessibleMapStyles(map: google.maps.Map) {
  // コントラストを高めたカスタムマップスタイル
  const highContrastStyle = [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }],
    },
    {
      featureType: 'road',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ weight: 2 }],
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'on' }],
    },
  ];

  map.setOptions({
    styles: highContrastStyle,
  });
}
```

## 高コントラストモードと色覚多様性対応

```typescript
// 色覚多様性に対応したマーカー作成
function createColorAccessibleMarkers(
  poi: PointOfInterest
): google.maps.marker.AdvancedMarkerElement {
  // 色覚多様性に配慮した色パレット
  const COLOR_BLIND_FRIENDLY_PALETTE = {
    red: '#E57373', // 赤系でも識別しやすい色調
    green: '#81C784', // 緑系でも識別しやすい色調
    blue: '#64B5F6', // 青系
    yellow: '#FFF176', // 黄色系
    purple: '#BA68C8', // 紫系
    orange: '#FFB74D', // オレンジ系
    teal: '#4DB6AC', // ティール系
  };

  // カテゴリに基づいて色覚多様性に配慮した色を選択
  const getAccessibleColor = (category: string): string => {
    switch (category) {
      case 'restaurant':
        return COLOR_BLIND_FRIENDLY_PALETTE.red;
      case 'cafe':
        return COLOR_BLIND_FRIENDLY_PALETTE.orange;
      case 'attraction':
        return COLOR_BLIND_FRIENDLY_PALETTE.blue;
      case 'accommodation':
        return COLOR_BLIND_FRIENDLY_PALETTE.green;
      case 'shop':
        return COLOR_BLIND_FRIENDLY_PALETTE.purple;
      case 'transport':
        return COLOR_BLIND_FRIENDLY_PALETTE.teal;
      default:
        return COLOR_BLIND_FRIENDLY_PALETTE.blue;
    }
  };

  // 色だけでなく形状も使って区別する
  const getCategoryGlyph = (category: string): string => {
    switch (category) {
      case 'restaurant':
        return '🍽️';
      case 'cafe':
        return '☕';
      case 'attraction':
        return '🏛️';
      case 'accommodation':
        return '🏠';
      case 'shop':
        return '🛒';
      case 'transport':
        return '🚌';
      default:
        return '📍';
    }
  };

  // Advanced Markerを作成
  return new google.maps.marker.AdvancedMarkerElement({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name,
    content: (() => {
      if ('PinElement' in google.maps.marker) {
        return new google.maps.marker.PinElement({
          background: getAccessibleColor(poi.category),
          glyph: getCategoryGlyph(poi.category),
          glyphColor: '#FFFFFF',
          borderColor: '#000000',
          scale: 1.2,
        }).element;
      } else {
        // フォールバックとしてDIV作成
        const div = document.createElement('div');
        div.innerHTML = getCategoryGlyph(poi.category);
        div.style.backgroundColor = getAccessibleColor(poi.category);
        div.style.width = '32px';
        div.style.height = '32px';
        div.style.borderRadius = '50%';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.border = '1px solid #000000';
        return div;
      }
    })(),
  });
}
```

## マップのWCAG 2.2準拠

```typescript
// WCAG 2.2準拠のマップコントロールセットアップ
function setupWCAG22CompliantControls(
  mapContainer: HTMLElement,
  map: google.maps.Map
): void {
  // 必要なARIAロールとラベルの追加
  mapContainer.setAttribute('role', 'application');
  mapContainer.setAttribute('aria-label', '佐渡島の観光マップ');
  mapContainer.setAttribute(
    'aria-description',
    '地図上のマーカーは観光スポットを示しています。キーボードでの操作が可能です。'
  );

  // コントロールのアクセシビリティ強化
  const enhanceControlAccessibility = (controls: NodeListOf<Element>) => {
    controls.forEach(control => {
      if (control instanceof HTMLElement) {
        // コントラストを強化
        control.style.backgroundColor = '#FFFFFF';
        control.style.color = '#000000';

        // 役割と状態を明示
        if (!control.hasAttribute('role')) {
          control.setAttribute('role', 'button');
        }

        // フォーカスインジケータの強化
        control.addEventListener('focus', () => {
          control.style.outline = '3px solid #4285F4';
          control.style.outlineOffset = '2px';
        });

        control.addEventListener('blur', () => {
          control.style.outline = '';
        });
      }
    });
  };

  // 既存のGoogle Maps UI要素にアクセシビリティ強化を適用
  const mapControls = mapContainer.querySelectorAll(
    '.gm-control-active, .gm-fullscreen-control'
  );
  enhanceControlAccessibility(mapControls);

  // モバイルデバイス向けの最適化（WCAG 2.2 2.5.8 Target Size対応）
  applyMobileAccessibilityOptimizations(mapContainer);

  // Google Mapsのポップアップや情報ウィンドウの監視と強化
  setupDynamicContentObserver(mapContainer);
}

// モバイルデバイス向けの最適化
function applyMobileAccessibilityOptimizations(container: HTMLElement): void {
  if (window.innerWidth <= 768) {
    // タッチターゲットサイズの拡大
    const touchControls = container.querySelectorAll(
      'button, [role="button"], .gm-control-active, .gm-fullscreen-control'
    );

    touchControls.forEach(control => {
      if (control instanceof HTMLElement) {
        control.style.minWidth = '44px';
        control.style.minHeight = '44px';
        control.style.padding = '12px';
      }
    });
  }
}

// WCAG 2.2 Success Criterion 1.4.11 Non-text Contrast 対応
function applyHighContrastStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .map-marker {
      border: 2px solid black !important;
    }
    
    .info-window {
      border: 1px solid #000 !important;
    }
    
    .keyboard-navigation *:focus {
      outline: 3px solid #4285F4 !important;
      outline-offset: 2px !important;
    }
    
    /* WCAG 2.2対応のUI要素スタイル */
    .gm-ui-hover-effect {
      min-width: 44px !important;
      min-height: 44px !important;
    }
  `;
  document.head.appendChild(style);
}

// マップインタラクションの代替手段提供
function provideAlternativeInteractions(
  map: google.maps.Map,
  pois: PointOfInterest[]
) {
  // 場所リストを提供（マップを見るのが難しいユーザー向け）
  const listContainer = document.createElement('div');
  listContainer.className = 'poi-accessible-list';
  listContainer.setAttribute('role', 'list');
  listContainer.setAttribute('aria-label', '佐渡島の観光スポット一覧');

  pois.forEach(poi => {
    const listItem = document.createElement('div');
    listItem.className = 'poi-list-item';
    listItem.setAttribute('role', 'listitem');
    listItem.setAttribute('tabindex', '0');

    // 場所情報を表示
    listItem.innerHTML = `
      <h3>${poi.name}</h3>
      <p>${getCategoryName(poi.category)}</p>
      ${poi.description ? `<p>${poi.description}</p>` : ''}
    `;

    // キーボード操作で場所を選択できるように
    listItem.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        map.panTo({ lat: poi.lat, lng: poi.lng });
        map.setZoom(16);
        onPoiSelect(poi);
      }
    });

    // クリックでも同様の操作ができるように
    listItem.addEventListener('click', () => {
      map.panTo({ lat: poi.lat, lng: poi.lng });
      map.setZoom(16);
      onPoiSelect(poi);
    });

    listContainer.appendChild(listItem);
  });

  // マップの隣に場所リストを表示
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.appendChild(listContainer);
  }
}

// 動的に生成されるUIコンテンツの監視と強化
function setupDynamicContentObserver(mapContainer: HTMLElement): void {
  // MutationObserverを使って動的に追加される要素を監視
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // 新しく追加されたinfoWindowやポップアップを強化
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            // InfoWindow関連要素を検出
            const infoWindows = node.querySelectorAll(
              '.gm-style-iw, .gm-ui-hover-effect'
            );
            if (infoWindows.length > 0) {
              enhanceInfoWindowAccessibility(infoWindows);
            }
          }
        });
      }
    });
  });

  // 監視の設定
  observer.observe(mapContainer, { childList: true, subtree: true });
}

// 情報ウィンドウのアクセシビリティ強化
function enhanceInfoWindowAccessibility(elements: NodeListOf<Element>): void {
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      // 情報ウィンドウ本体の場合
      if (element.classList.contains('gm-style-iw')) {
        element.setAttribute('role', 'dialog');
        element.setAttribute('aria-modal', 'false');

        // タイトルがあれば関連付け
        const title = element.querySelector(
          'h1, h2, h3, h4, h5, h6, [role="heading"]'
        );
        if (title && title.id) {
          element.setAttribute('aria-labelledby', title.id);
        } else if (title) {
          const titleId = `info-window-title-${Date.now()}`;
          title.id = titleId;
          element.setAttribute('aria-labelledby', titleId);
        }
      }
      // 閉じるボタンの場合
      else if (element.classList.contains('gm-ui-hover-effect')) {
        element.setAttribute('aria-label', '情報ウィンドウを閉じる');
        element.setAttribute('role', 'button');
      }

      // モバイル対応
      if (window.innerWidth <= 768) {
        if (element.classList.contains('gm-ui-hover-effect')) {
          element.style.minWidth = '44px';
          element.style.minHeight = '44px';
        }
      }
    }
  });
}
```

## アクセシビリティチェックリスト

Google Mapsを実装する際、アクセシビリティ対応のために以下のチェックリストを確認しましょう。

### スクリーンリーダー対応

- [ ] マーカーに適切な`aria-label`属性が設定されている
- [ ] マップコンテナに適切な`role`と`aria-label`が設定されている
- [ ] スクリーンリーダー用の状態通知メカニズムがある
- [ ] インフォウィンドウのコンテンツが適切に構造化されている

### キーボード操作

- [ ] マーカーとコントロールがTabキーでフォーカス可能
- [ ] Escキーでマップからフォーカスを外せる
- [ ] フォーカスの視覚的インジケータが明確
- [ ] フォーカストラップが起きない

### 視覚的ユーザビリティ

- [ ] コントラスト比がWCAG AAレベル（4.5:1）以上
- [ ] 色覚多様性に配慮した配色
- [ ] 形状と色の組み合わせで情報を伝達
- [ ] テキストサイズの変更に対応可能

### モバイル対応

- [ ] タッチターゲットサイズが44px×44px以上
- [ ] 適切なタッチフィードバックがある
- [ ] ピンチズームが無効化されていない
- [ ] ジェスチャー操作に代わる手段がある

### 静的ホスティング特有の考慮事項

- [ ] 読み込み状態が適切に通知される
- [ ] オフラインや低速接続時のフォールバック対応
- [ ] パフォーマンス最適化（アニメーション削減など）
- [ ] 外部リソース依存の最小化

## 参考資料と関連ガイドライン

- [Google Maps Platform アクセシビリティガイド](https://developers.google.com/maps/documentation/javascript/accessibility)
- [WCAG 2.2 チェックリスト](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [静的ホスティング環境での最適化](../static_hosting_guidelines.md)
- [パフォーマンス最適化](./07_performance.md) - アクセシビリティとパフォーマンスの両立についての詳細

## 更新履歴

- **2025年4月28日**: WCAG 2.2対応の最新ガイドラインを追加
- **2025年2月15日**: 色覚多様性サポートの強化
- **2024年12月10日**: 静的ホスティング環境向けのアクセシビリティ対応を追加
