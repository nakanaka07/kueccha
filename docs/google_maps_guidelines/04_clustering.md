# 4. マーカークラスタリング実装

## クラスタリング設定のベストプラクティス

```typescript
// クラスタリング設定の例
const setupClustering = (markers: google.maps.marker.AdvancedMarkerElement[], map: google.maps.Map): MarkerClusterer => {
  return new MarkerClusterer({
    map,
    markers,
    renderer: {
      render: ({ count, position }) => {
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content: createClusterIcon(count)
        });
      }
    },
    // クラスタリングアルゴリズムのオプション
    algorithm: {
      maxZoom: 14,           // このズームレベル以上ではクラスタリングしない
      gridSize: 60,          // クラスタリングのグリッドサイズ（ピクセル）
      minimumClusterSize: 3  // クラスタを形成する最小マーカー数
    }
  });
};
```

## カスタムクラスターレンダラーの実装

```typescript
// カスタムクラスターアイコンの作成
function createClusterIcon(count: number): HTMLElement {
  const div = document.createElement('div');
  
  // 数に応じてスタイル変更
  const size = Math.min(45, Math.max(35, 35 + Math.log10(count) * 5));
  const fontSize = Math.min(18, Math.max(13, 13 + Math.log10(count) * 2));
  
  div.style.width = `${size}px`;
  div.style.height = `${size}px`;
  div.style.borderRadius = '50%';
  div.style.backgroundColor = count > 100 ? '#FF5252' : count > 50 ? '#FF9800' : '#4CAF50';
  div.style.border = '2px solid white';
  div.style.boxSizing = 'border-box';
  div.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
  div.style.color = 'white';
  div.style.fontWeight = 'bold';
  div.style.fontSize = `${fontSize}px`;
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.textContent = count.toString();
  
  return div;
}
```

## クラスタリングのパフォーマンス最適化

- **遅延クラスタリング**: マップの動きが止まった時のみクラスタリングを更新
- **計算分散**: 非同期処理を利用してUIブロッキングを防止
- **ズームレベル対応**: ズームレベルに応じたクラスタリング戦略の変更

```typescript
// 遅延クラスタリングの例
const debouncedUpdateClusters = useMemo(() => {
  return debounce((markers: google.maps.marker.AdvancedMarkerElement[], clusterer: MarkerClusterer) => {
    clusterer.clearMarkers();
    clusterer.addMarkers(markers);
  }, 300);
}, []);

// マップ移動時の処理
map.addListener('idle', () => {
  if (enableClustering && filteredMarkers.length > MIN_MARKERS_FOR_CLUSTERING) {
    debouncedUpdateClusters(filteredMarkers, clusterer);
  }
});
```
