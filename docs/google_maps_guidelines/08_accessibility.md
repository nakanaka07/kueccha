# 8. アクセシビリティとユーザビリティ対応

## スクリーンリーダー対応

```typescript
// アクセシブルなマーカーの作成
function createAccessibleMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement {
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
      element.setAttribute('aria-label', `${poi.name}、${getCategoryName(poi.category)}、緯度経度 ${poi.lat}、${poi.lng}`);
      element.setAttribute('tabindex', '0');
      
      // キーボード操作のサポート
      element.addEventListener('keydown', (event) => {
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

## キーボード操作対応

```typescript
// キーボード操作に対応したマップコントロール
function setupKeyboardAccessibility(map: google.maps.Map) {
  // フォーカストラップ対策
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.setAttribute('tabindex', '-1');
    
    // Escキーでマップからフォーカスを外せるようにする
    mapContainer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const exitMapButton = document.getElementById('exit-map-button');
        if (exitMapButton) {
          exitMapButton.focus();
        }
      }
    });
  }
  
  // マップコントロールのアクセシビリティ強化
  const setupA11yForControl = (controlId: string, label: string) => {
    const control = document.getElementById(controlId);
    if (control) {
      control.setAttribute('aria-label', label);
      control.setAttribute('role', 'button');
      control.setAttribute('tabindex', '0');
    }
  };
  
  // 各コントロールの設定
  setupA11yForControl('zoom-in-button', 'ズームイン');
  setupA11yForControl('zoom-out-button', 'ズームアウト');
  setupA11yForControl('fullscreen-button', '全画面表示切り替え');
}
```

## 視覚的ユーザビリティの強化

```typescript
// 視認性を高めるマップスタイルの設定
function applyAccessibleMapStyles(map: google.maps.Map) {
  // コントラストを高めたカスタムマップスタイル
  const highContrastStyle = [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }]
    },
    {
      featureType: 'road',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ weight: 2 }]
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'on' }]
    }
  ];
  
  map.setOptions({
    styles: highContrastStyle
  });
}
```

## 高コントラストモードと色覚多様性対応

```typescript
// 色覚多様性に対応したマーカー作成
function createColorAccessibleMarkers(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement {
  // 色覚多様性に配慮した色パレット
  const COLOR_BLIND_FRIENDLY_PALETTE = {
    red: '#E57373',     // 赤系でも識別しやすい色調
    green: '#81C784',   // 緑系でも識別しやすい色調
    blue: '#64B5F6',    // 青系
    yellow: '#FFF176',  // 黄色系
    purple: '#BA68C8',  // 紫系
    orange: '#FFB74D',  // オレンジ系
    teal: '#4DB6AC'     // ティール系
  };

  // カテゴリに基づいて色覚多様性に配慮した色を選択
  const getAccessibleColor = (category: string): string => {
    switch (category) {
      case 'restaurant': return COLOR_BLIND_FRIENDLY_PALETTE.red;
      case 'cafe': return COLOR_BLIND_FRIENDLY_PALETTE.orange;
      case 'attraction': return COLOR_BLIND_FRIENDLY_PALETTE.blue;
      case 'accommodation': return COLOR_BLIND_FRIENDLY_PALETTE.green;
      case 'shop': return COLOR_BLIND_FRIENDLY_PALETTE.purple;
      case 'transport': return COLOR_BLIND_FRIENDLY_PALETTE.teal;
      default: return COLOR_BLIND_FRIENDLY_PALETTE.blue;
    }
  };

  // 色だけでなく形状も使って区別する
  const getCategoryGlyph = (category: string): string => {
    switch (category) {
      case 'restaurant': return '🍽️';
      case 'cafe': return '☕';
      case 'attraction': return '🏛️';
      case 'accommodation': return '🏠';
      case 'shop': return '🛒';
      case 'transport': return '🚌';
      default: return '📍';
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
          scale: 1.2
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
    })()
  });
}
```

## マップのWCAG 2.2準拠

```typescript
// WCAG 2.2準拠のマップコントロールセットアップ
function setupWCAG22CompliantControls(mapContainer: HTMLElement, map: google.maps.Map) {
  // フォーカス可視性の強化
  mapContainer.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });
  
  // マウス使用時はフォーカス表示を通常に戻す
  mapContainer.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });
  
  // 必要なARIAロールの追加
  mapContainer.setAttribute('role', 'application');
  mapContainer.setAttribute('aria-label', '佐渡島の観光マップ');
  
  // マップコントロールのアクセシビリティ強化
  const controls = mapContainer.querySelectorAll('.gm-control-active');
  controls.forEach(control => {
    if (control instanceof HTMLElement) {
      // コントラストを強化
      control.style.backgroundColor = '#FFFFFF';
      control.style.color = '#000000';
      
      // フォーカス時の視覚的インジケータ
      control.addEventListener('focus', () => {
        control.style.outline = '3px solid #4285F4';
      });
      
      control.addEventListener('blur', () => {
        control.style.outline = '';
      });
    }
  });
  
  // モバイル用の追加アクセシビリティ設定
  if (window.innerWidth <= 768) {
    // タッチターゲットサイズの拡大（WCAG 2.2 2.5.8 Target Size (minimum)）
    const touchControls = mapContainer.querySelectorAll('.gm-control-active, .gm-fullscreen-control');
    touchControls.forEach(control => {
      if (control instanceof HTMLElement) {
        control.style.minWidth = '44px';
        control.style.minHeight = '44px';
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
function provideAlternativeInteractions(map: google.maps.Map, pois: PointOfInterest[]) {
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
    listItem.addEventListener('keydown', (event) => {
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
```
