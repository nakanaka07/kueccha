# 7. パフォーマンス最適化

## マーカーの遅延読み込みと表示範囲最適化

```typescript
// マーカーの遅延読み込み実装例
const useMarkerVisibility = ({
  mapRef,
  markers,
  visibilityMargin = 0.5, // 表示領域を50%拡張
  debounceMs = 300
}) => {
  const [visibleMarkers, setVisibleMarkers] = useState<typeof markers>([]);
  
  // 表示範囲の計算を最適化
  const updateVisibleMarkers = useMemo(() => {
    return debounce(() => {
      const map = mapRef.current;
      if (!map) return;
      
      const bounds = map.getBounds();
      if (!bounds) return;
      
      // 表示範囲を拡張
      const extendedBounds = calculateExtendedBounds(bounds, visibilityMargin);
      
      // 表示範囲内のマーカーのみをフィルタリング
      const newVisibleMarkers = markers.filter(marker => {
        const position = marker.position;
        return position && extendedBounds.contains(position);
      });
      
      setVisibleMarkers(newVisibleMarkers);
    }, debounceMs);
  }, [mapRef, markers, visibilityMargin, debounceMs]);
  
  // マップの移動やズーム変更時にマーカー表示を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    const listeners = [
      map.addListener('idle', updateVisibleMarkers),
      map.addListener('zoom_changed', updateVisibleMarkers)
    ];
    
    // 初回実行
    updateVisibleMarkers();
    
    return () => {
      listeners.forEach(listener => google.maps.event.removeListener(listener));
    };
  }, [mapRef, updateVisibleMarkers]);
  
  return { visibleMarkers };
};

// 拡張した地図表示領域を計算
function calculateExtendedBounds(
  bounds: google.maps.LatLngBounds, 
  margin: number
): google.maps.LatLngBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  const latSpan = ne.lat() - sw.lat();
  const lngSpan = ne.lng() - sw.lng();
  
  const extendedBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(
      sw.lat() - latSpan * margin,
      sw.lng() - lngSpan * margin
    ),
    new google.maps.LatLng(
      ne.lat() + latSpan * margin,
      ne.lng() + lngSpan * margin
    )
  );
  
  return extendedBounds;
}
```

## 地図タイルとAPIリソースの最適化

- **初期マップ範囲の適切な設定**: 佐渡島全体が表示される範囲に限定
- **ライブラリの選択的読み込み**: 必要なAPIライブラリのみロード
- **需要ベースのタイル読み込み**: 表示される可能性が高い領域のタイルを優先的に読み込み
- **WebGL レンダリングの活用**: パフォーマンス向上のためのWebGLモード設定

```typescript
// WebGLレンダリング設定を含むマップ初期化オプション
const DEFAULT_MAP_OPTIONS = {
  center: { lat: 38.0413, lng: 138.3689 }, // 佐渡島の中心
  zoom: 10, // 島全体が見える程度
  minZoom: 7, // 過度にズームアウトを制限
  maxZoom: 18, // ズームインも適切に制限
  restriction: {
    latLngBounds: {
      north: 38.4,  // 佐渡島周辺に制限
      south: 37.6,
      east: 138.8,
      west: 137.9
    },
    strictBounds: false // 少しの余裕を持たせる
  },
  // WebGLレンダリングを有効化
  mapId: 'YOUR_MAP_ID', // Cloud Console で作成したMapID
  useStaticMap: true, // 初期表示を高速化
};

// WebGLレンダリングの確認
function isWebGLSupported(map: google.maps.Map): boolean {
  return Boolean(map.getMapCapabilities().isAdvancedMarkersAvailable);
}
```

## メモリ使用量の最適化

```typescript
// マーカーのクリーンアップ例
function cleanupMarkers(
  markers: (google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[],
  clusterer: MarkerClusterer | null
): void {
  // イベントリスナーを削除
  markers.forEach(marker => {
    google.maps.event.clearInstanceListeners(marker);
  });
  
  // マーカーをマップから削除
  markers.forEach(marker => {
    if ('map' in marker) {
      marker.map = null;
    } else if ('setMap' in marker) {
      marker.setMap(null);
    }
  });

  // クラスタラーをクリーンアップ
  if (clusterer) {
    clusterer.clearMarkers();
    clusterer.setMap(null);
  }
}

// コンポーネントのクリーンアップ処理
useEffect(() => {
  return () => {
    cleanupMarkers(currentMarkers, currentClusterer);
  };
}, []);
```
