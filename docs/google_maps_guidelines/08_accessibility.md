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
