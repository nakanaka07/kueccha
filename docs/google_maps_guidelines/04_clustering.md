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

## 2025年版高度なクラスタリング技術

```typescript
// 2025年版の高度なクラスタリング設定例
const setupAdvancedClustering = (
  markers: google.maps.marker.AdvancedMarkerElement[], 
  map: google.maps.Map
): MarkerClusterer => {
  // マーカーをカテゴリー別にグループ化
  const markersByCategory = groupMarkersByCategory(markers);
  
  // 重要度の高いカテゴリーを設定（常に表示したいもの）
  const priorityCategories = ['restaurant', 'attraction', 'accommodation'];
  
  return new MarkerClusterer({
    map,
    markers,
    renderer: {
      render: ({ count, position, markers: clusterMarkers }) => {
        // クラスター内のマーカーカテゴリを分析
        const categoryCount = analyzeCategoriesInCluster(clusterMarkers);
        const primaryCategory = getPrimaryCategory(categoryCount, priorityCategories);
        
        // 2025年の新機能：クラスターコンテンツの動的生成
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content: createEnhancedClusterElement({
            count,
            primaryCategory,
            categoryCount
          }),
          // 2025年の新機能：クラスターの衝突動作を設定
          collisionBehavior: primaryCategory && priorityCategories.includes(primaryCategory) 
            ? 'REQUIRED' 
            : 'OPTIONAL_AND_HIDES_LOWER_PRIORITY'
        });
      }
    },
    // 2025年の最適化されたクラスタリングアルゴリズム
    algorithm: {
      maxZoom: 15,
      gridSize: getResponsiveGridSize(),
      minimumClusterSize: 3,
      // 新機能：ビューポート中心からの距離に基づく可変グリッドサイズ
      viewportAwareGridSize: true,
      // 新機能：ユーザー操作中の一時的クラスタリング解除
      disableClusteringOnDrag: true
    },
    // 2025年の新機能：クラスターレンダリングのパフォーマンス最適化
    renderingOptimization: {
      deferRenderingOutsideViewport: true,
      useWebGLForLargeDatasets: true,
      maxMarkersForInstantClustering: 5000,
      batchProcessingSize: 1000
    }
  });
};

// 2025年推奨：デバイスとズームレベルに応じた最適なグリッドサイズを計算
function getResponsiveGridSize(): number {
  const isMobileDevice = window.innerWidth < 768;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // モバイルデバイスでは小さめのグリッドサイズ
  const baseSize = isMobileDevice ? 50 : 60;
  
  // 高解像度画面の場合は調整
  const adjustedSize = Math.round(baseSize * Math.min(1.5, devicePixelRatio));
  
  return adjustedSize;
}

// カテゴリーに基づく高度なクラスターアイコン生成
function createEnhancedClusterElement({
  count, 
  primaryCategory, 
  categoryCount
}: {
  count: number;
  primaryCategory: string | null;
  categoryCount: Record<string, number>;
}): HTMLElement {
  const container = document.createElement('div');
  container.className = 'advanced-cluster';
  
  // サイズをマーカー数に応じて調整（対数スケール）
  const size = Math.min(55, Math.max(40, 40 + Math.log10(count) * 7));
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;
  
  // カテゴリーに応じた色を設定
  const backgroundColor = primaryCategory 
    ? getCategoryColor(primaryCategory) 
    : '#1E88E5';
  
  // メインのクラスターサークルを作成
  const mainCircle = document.createElement('div');
  mainCircle.className = 'cluster-main-circle';
  mainCircle.style.width = '100%';
  mainCircle.style.height = '100%';
  mainCircle.style.borderRadius = '50%';
  mainCircle.style.backgroundColor = backgroundColor;
  mainCircle.style.display = 'flex';
  mainCircle.style.alignItems = 'center';
  mainCircle.style.justifyContent = 'center';
  mainCircle.style.color = '#FFFFFF';
  mainCircle.style.fontWeight = 'bold';
  mainCircle.style.fontSize = `${Math.max(12, Math.min(18, 13 + Math.log10(count)))}px`;
  mainCircle.style.border = '2px solid white';
  mainCircle.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
  mainCircle.textContent = count.toString();
  
  // 複数カテゴリーを表すミニサークルを追加（最大3つ）
  const categories = Object.keys(categoryCount).filter(cat => cat !== primaryCategory);
  if (categories.length > 0) {
    // カテゴリーを重要度順にソート
    categories.sort((a, b) => categoryCount[b] - categoryCount[a]);
    
    // 上位2つのカテゴリーのみ表示
    const topCategories = categories.slice(0, 2);
    
    topCategories.forEach((category, index) => {
      const miniCircle = document.createElement('div');
      miniCircle.className = 'cluster-mini-circle';
      miniCircle.style.width = '40%';
      miniCircle.style.height = '40%';
      miniCircle.style.borderRadius = '50%';
      miniCircle.style.position = 'absolute';
      miniCircle.style.backgroundColor = getCategoryColor(category);
      miniCircle.style.border = '1px solid white';
      
      // 位置を調整（右上、右下）
      const angle = (index * Math.PI / 2) + Math.PI / 4;
      const x = Math.cos(angle) * size * 0.4;
      const y = Math.sin(angle) * size * 0.4;
      
      miniCircle.style.transform = `translate(${x}px, ${y}px)`;
      container.appendChild(miniCircle);
    });
  }
  
  container.appendChild(mainCircle);
  return container;
}
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
