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

## 2025年の最新マーカー機能の活用

```typescript
// 2025年最新のAdvanced Markerの機能を活用した例
function createEnhancedAdvancedMarker(poi: PointOfInterest): google.maps.marker.AdvancedMarkerElement {
  // 新しい機能を持つAdvanced Markerを作成
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name,
    // 2025年の新機能：クリック可能性をコントロール
    gmpClickable: poi.isInteractive !== false,
    // 2025年の新機能：ドラッグ可能性をコントロール
    gmpDraggable: poi.isDraggable === true,
    // 2025年の新機能：マーカーの可視性
    gmpVisible: !poi.isHidden,
    // カスタム要素の構築
    content: (() => {
      // PinElementが利用可能な場合はそれを使用
      if ('PinElement' in google.maps.marker) {
        const pinOptions = {
          background: getCategoryColor(poi.category),
          scale: poi.isHighlighted ? 1.2 : 1,
          glyph: getGlyphForPOI(poi),
          glyphColor: getGlyphColorForPOI(poi),
          borderColor: poi.isRecommended ? '#FFD700' : undefined,
          // 2025年の新機能：角の丸みをカスタマイズ
          borderRadius: poi.isSpecial ? '0%' : '50%'
        };
        return new google.maps.marker.PinElement(pinOptions).element;
      } 
      
      // フォールバックとしてカスタムDIV要素を使用
      return createCustomMarkerElement(poi);
    })(),
    // 2025年の新機能：マーカー衝突時の振る舞い
    collisionBehavior: poi.isPriority 
      ? 'REQUIRED' // 常に表示 
      : 'OPTIONAL_AND_HIDES_LOWER_PRIORITY' // 必要に応じて非表示
  });
  
  return marker;
}

// マーカーのサイズを状況に応じて最適化する2025年推奨パターン
function getOptimalMarkerSize(
  devicePixelRatio: number, 
  isMobileDevice: boolean, 
  isImportant: boolean
): number {
  // 基本サイズ設定
  let baseSize = 32;
  
  // 高解像度画面の場合はサイズ調整
  if (devicePixelRatio > 1) {
    baseSize = Math.floor(baseSize / devicePixelRatio) * devicePixelRatio;
  }
  
  // モバイルデバイスの場合は少し大きく
  if (isMobileDevice) {
    baseSize += 4;
  }
  
  // 重要度に応じてサイズ変更
  if (isImportant) {
    baseSize += 8;
  }
  
  return baseSize;
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

## マーカーの状態管理と更新

```typescript
// マーカーの状態変化を効率的に処理する
function updateMarkerState(
  marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker,
  newState: Partial<POIState>,
  prevState?: POIState
): void {
  // 変更がない場合は更新をスキップ
  if (prevState &&
      prevState.isHighlighted === newState.isHighlighted &&
      prevState.isSelected === newState.isSelected &&
      prevState.isHovered === newState.isHovered) {
    return;
  }

  // マーカータイプに応じた更新処理
  if (isAdvancedMarker(marker)) {
    // Advanced Markerの場合
    updateAdvancedMarkerState(marker, newState);
  } else {
    // 従来のマーカーの場合
    updateLegacyMarkerState(marker as google.maps.Marker, newState);
  }
}

// 最新のAdvanced Markerを最適化して更新
function updateAdvancedMarkerState(
  marker: google.maps.marker.AdvancedMarkerElement, 
  state: Partial<POIState>
): void {
  // 2025年の推奨：マーカーのDOMコンテンツ直接更新よりプロパティ更新が効率的
  if (state.isVisible !== undefined) {
    marker.gmpVisible = state.isVisible;
  }

  // マーカーのスケールやスタイル変更（DOMアクセス最小化）
  const content = marker.content;
  if (content && content instanceof HTMLElement) {
    // 既存のクラスを維持しながら状態クラスのみ更新
    const classesToRemove = ['highlighted', 'selected', 'hovered'];
    const classesToAdd = [];
    
    if (state.isHighlighted) classesToAdd.push('highlighted');
    if (state.isSelected) classesToAdd.push('selected');
    if (state.isHovered) classesToAdd.push('hovered');
    
    // 不要なクラスを削除
    content.classList.remove(...classesToRemove);
    // 必要なクラスを追加
    if (classesToAdd.length > 0) {
      content.classList.add(...classesToAdd);
    }
    
    // アニメーション効果を最適化（パフォーマンスに影響しない範囲で）
    if (state.isHighlighted || state.isSelected) {
      content.style.transform = 'scale(1.2)';
      content.style.zIndex = '1';
      content.style.transition = 'transform 0.2s ease';
    } else {
      content.style.transform = '';
      content.style.zIndex = '';
      content.style.transition = '';
    }
  }
}
```
