# 3. マーカー管理のベストプラクティス

## マーカー種類の選択基準

- **Advanced Marker**: 最新のカスタマイズ機能を活用する場合に使用
- **従来のMarker**: 互換性が必要な場合や特定のカスタム要件がある場合に使用

```typescript
// マーカー種類を適切に選択する例
function createMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement | google.maps.Marker {
  // Advanced Marker APIが利用可能かどうかをチェック
  const useAdvancedMarker =
    typeof google.maps.marker !== 'undefined' &&
    'AdvancedMarkerElement' in google.maps.marker &&
    typeof google.maps.marker.AdvancedMarkerElement === 'function';

  return useAdvancedMarker
    ? createAdvancedMarker(poi)
    : createLegacyMarker(poi);
}
```

## 効率的なマーカーの作成と更新

- **ポイントの識別**: 各マーカーに一意のIDを割り当てる
- **キャッシュ**: マーカーオブジェクトをキャッシュして再利用
- **バッチ更新**: マーカー更新を一度にまとめて処理

```typescript
// マーカーキャッシュの例
const markerCacheRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>>(
  new Map()
);

// POIのIDを一貫して取得するヘルパー関数
const getPoiId = useCallback((poi: PointOfInterest): string => {
  return poi.id || `${poi.lat}-${poi.lng}-${poi.name}`;
}, []);

// マーカーの取得または作成
function getOrCreateMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement | google.maps.Marker {
  const id = getPoiId(poi);
  const existingMarker = markerCacheRef.current.get(id);
  
  if (existingMarker) {
    updateMarker(existingMarker, poi);
    return existingMarker;
  }
  
  const newMarker = createMarker(poi);
  markerCacheRef.current.set(id, newMarker);
  return newMarker;
}
```

## カスタムマーカーの作成とスタイリング

```typescript
// Advanced Markerのカスタマイズ例
function createCustomAdvancedMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement {
  return new google.maps.marker.AdvancedMarkerElement({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name,
    content: (() => {
      // PinElementが利用可能な場合はそれを使用
      if ('PinElement' in google.maps.marker) {
        const pin = new google.maps.marker.PinElement({
          background: getIconUrl(poi.category),
          scale: poi.isHighlighted ? 1.2 : 1,
          glyph: poi.isClosed ? '×' : '',
          glyphColor: poi.isClosed ? '#ff0000' : '',
          borderColor: poi.isRecommended ? '#FFD700' : ''
        });
        return pin.element;
      } 
      
      // フォールバックとしてカスタムDIV要素を使用
      const div = document.createElement('div');
      div.style.backgroundImage = `url(${getIconUrl(poi.category)})`;
      div.style.width = '32px';
      div.style.height = '32px';
      div.style.backgroundSize = 'cover';
      return div;
    })()
  });
}
```

## イベントハンドリングとメモリリーク防止

```typescript
// マーカーイベントの適切な管理
function setupMarkerEvents(marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker, poi: PointOfInterest) {
  // クリックイベントのセットアップ
  const clickListener = marker.addListener('click', () => {
    onMarkerClick(poi);
  });
  
  // クリーンアップ用のフィルターを保存
  listenerRefs.current.push({
    marker,
    listener: clickListener,
    poiId: poi.id
  });
}

// コンポーネントのアンマウント時にリスナーをクリーンアップ
useEffect(() => {
  return () => {
    listenerRefs.current.forEach(({ marker }) => {
      google.maps.event.clearInstanceListeners(marker);
    });
    listenerRefs.current = [];
  };
}, []);
```
