# コード最適化ガイドライン

## 1. 最適化の基本理念

### プロジェクトの最適化目標
- **保守性と明確さの向上**: コードの自己文書化、関数の単一責任化、理解しやすいコメント追加、論理的なプロジェクト構造整理
- **学習と成長を促進する設計**: シンプルで理解しやすいパターンの採用、段階的に拡張可能なコード構造、再利用可能なコンポーネント設計
- **安定性とエラー耐性**: ユーザー体験を守るエラーハンドリング強化、データ欠損時のフォールバック対応、デバッグを容易にするログ機能改善
- **ユーザー体験の最適化**: 地図とマーカーの初期表示速度改善、モバイル操作性向上、可能な範囲でのオフライン対応

### バランスの取れた改善アプローチ
- シンプルさ優先の原則（KISS: Keep It Simple, Stupid）
- 必要になるまで機能を追加しない原則（YAGNI: You Aren't Gonna Need It）
- 完璧を求めず継続的に改善する反復的アプローチ
- 技術的負債と即時の改善のバランスを取る

### 最適化の優先順位付け
- ユーザー体験に直接影響する問題を最優先
- パフォーマンスのボトルネックとなる箇所の特定と改善
- 保守性とコード品質の向上を継続的に実施
- 緊急度と難易度に基づく優先度マトリクスの活用

## 2. コード構造と設計原則

### 保守性と拡張性の確保
- 単一責任の原則（SRP）：一つのコンポーネント・関数は一つの責任のみを持つ
- コードの重複を避ける（DRY: Don't Repeat Yourself）
- 明示的優先：動作が予測可能なコード作成
- 段階的成長の原則：小さな改善を継続的に行う

### コンポーネント設計の原則
- 宣言的UIパターン：命令型より宣言型のコーディング
- 適切なサイズのコンポーネント分割
- props down, events up の単方向データフロー
- 再利用可能なコンポーネント設計

### データフローの最適化
- 状態管理の一元化：コンポーネント間で共有される状態を明確に定義
- 不要な再レンダリングの防止：必要な場合のみ再レンダリングが発生する設計
- データ取得と表示ロジックの分離：関心の分離による保守性向上
- キャッシュ戦略の適用：同じデータの再取得を回避

### Zustand状態管理のベストプラクティス
- **スライスパターン**: 大規模アプリケーション向けのストア分割設計
- **セレクタの最適化**: 必要最小限のデータだけを購読し再レンダリングを制御
- **永続化とミドルウェア**: 永続化とデバッグ用のミドルウェア統合
- **TypeScript型安全性**: 完全な型支援によるエラー防止

```typescript
// Zustand v5のスライスパターンを使った実装例
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 型定義
interface POIState {
  pois: PointOfInterest[];
  selectedPOI: PointOfInterest | null;
  isLoading: boolean;
  error: Error | null;
  
  // アクション
  fetchPOIs: (category?: string) => Promise<void>;
  selectPOI: (id: string) => void;
  clearSelection: () => void;
}

// ストア作成
export const usePOIStore = create<POIState>()(
  persist(
    (set, get) => ({
      pois: [],
      selectedPOI: null,
      isLoading: false,
      error: null,
      
      fetchPOIs: async (category) => {
        set({ isLoading: true, error: null });
        try {
          // データフェッチ処理...
          const data = await fetchPOIData(category);
          set({ pois: data, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error : new Error('Unknown error'), isLoading: false });
        }
      },
      
      selectPOI: (id) => {
        const poi = get().pois.find(p => p.id === id) || null;
        set({ selectedPOI: poi });
      },
      
      clearSelection: () => set({ selectedPOI: null })
    }),
    {
      name: 'poi-storage',  // localStorage/sessionStorageのキー
      partialize: (state) => ({ pois: state.pois }), // 永続化する状態を選択
    }
  )
);

// 最適化されたセレクタの使用例
function POIDetailView() {
  // 必要な状態のみを選択し、他の状態が変更されても再レンダリングしない
  const selectedPOI = usePOIStore(state => state.selectedPOI);
  const clearSelection = usePOIStore(state => state.clearSelection);
  
  if (!selectedPOI) return null;
  
  return (
    <div>
      <h2>{selectedPOI.name}</h2>
      <button onClick={clearSelection}>閉じる</button>
      {/* POI詳細表示 */}
    </div>
  );
}
```

### パスエイリアスの効果的活用
- プロジェクトで定義されているパスエイリアス：
  - `@/*` → `src/*`
  - `@/assets/*` → `src/assets/*`
  - `@/components/*` → `src/components/*`
  - `@/constants/*` → `src/constants/*`
  - `@/hooks/*` → `src/hooks/*`
  - `@/types/*` → `src/types/*`
  - `@/utils/*` → `src/utils/*`
- 新規ファイル作成時は常にエイリアスを使用
- 同じフォルダ内でも相対パスではなくエイリアスを一貫して使用
- インポート群のアルファベット順配置

## 3. パフォーマンス最適化技術

### React特有の最適化手法
- メモ化戦略：React.memo、useMemo、useCallbackの適切な使用
- 仮想化リスト：大量データ表示時のwindowingテクニック
- コード分割：React.lazyとSuspenseによる遅延ロード
- Webパフォーマンス指標（CLS、FID、LCP）の監視と最適化
- **React 19の新機能活用**：
  - Actions APIを使用した効率的な非同期処理
  - useTransitionとuseDeferredValueによる優先度の低いレンダリング制御
  - 大規模UIでのサスペンスベースのローディングパターン
  - サーバーコンポーネント対応を見据えたコード分割設計

```typescript
// React 19のActions APIを活用した例
import { useFormAction } from 'react';
import { redirectWithAlert } from '@/utils/navigation';

// Action定義（非同期処理を効率的に扱える）
const saveAction = async (formData: FormData) => {
  // フォームデータを処理
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  
  try {
    await savePoiToDatabase({ name, category });
    // 成功処理を返す（新しいナビゲーション操作）
    return redirectWithAlert('/pois', '保存に成功しました');
  } catch (error) {
    // エラーオブジェクトを返すと、フォームが自動的に再レンダリング
    return { message: 'データの保存に失敗しました' };
  }
};

// コンポーネント内での使用
function POIForm() {
  const formAction = useFormAction(saveAction);
  
  return (
    <form action={formAction}>
      <input name="name" required />
      <input name="category" required />
      <button type="submit">保存</button>
    </form>
  );
}
```

### Suspenseパターンの高度な活用

#### データフェッチングのサスペンス対応
- **宣言的なローディング状態**: コンポーネント境界でのローディングUI定義
- **並列データフェッチング**: 複数のデータソースを並行して読み込み
- **段階的なUI表示**: 重要なコンテンツから順次表示する戦略

```typescript
// Suspenseを活用したデータ読み込みパターン
import { Suspense, lazy } from 'react';
import { createResource } from '@/utils/suspense-resource';

// データリソースの定義
const poiResource = createResource(async () => {
  const response = await fetch('/data/poi.json');
  if (!response.ok) throw new Error('POIデータの取得に失敗しました');
  return response.json();
});

// 遅延ロードするコンポーネント
const POIDetails = lazy(() => import('@/components/POIDetails'));

function POIMap() {
  return (
    <div className="poi-app">
      {/* マップコンポーネントはすぐに表示 */}
      <MapBase />
      
      {/* POIデータ読み込み中は代替UIを表示 */}
      <Suspense fallback={<POIListSkeleton />}>
        <POIList resource={poiResource} />
      </Suspense>
      
      {/* 詳細情報は別のサスペンス境界で管理 */}
      <Suspense fallback={<DetailsSkeleton />}>
        <POIDetails />
      </Suspense>
    </div>
  );
}

// Suspense対応のデータ読み込みコンポーネント
function POIList({ resource }) {
  // このコンポーネントではデータ読み込み中にサスペンドする
  const pois = resource.read();
  
  return (
    <ul>
      {pois.map(poi => (
        <li key={poi.id}>{poi.name}</li>
      ))}
    </ul>
  );
}
```

#### サスペンスを活用したUX改善
- **スケルトンUI**: 詳細なローディングプレースホルダー
- **コンテンツの優先順位付け**: 重要なコンテンツから順に表示
- **エラーバウンダリとの連携**: データ読み込み失敗時の優雅なフォールバック

## 4. API管理とデータフェッチング戦略

### モダンなデータフェッチング手法

#### TanStack Queryの効果的な活用
- **自動キャッシュとリフェッチ**: 賢いキャッシュ戦略によるデータ鮮度の確保
- **楽観的UI更新とエラー回復**: ユーザー体験を損なわないデータ更新
- **リクエスト重複排除とバックグラウンド更新**: パフォーマンス向上と最新データの提供

```typescript
// TanStack Query v5を使ったPOIデータフェッチング実装
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPOIs, updatePOI } from '@/utils/api';

// データ取得用フック
function usePOIData(category: string | undefined) {
  return useQuery({
    queryKey: ['pois', { category }],
    queryFn: () => fetchPOIs(category),
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを最新とみなす
    gcTime: 10 * 60 * 1000,   // 10分間はバックグラウンドでデータを保持
    retry: 2,                 // 失敗時に2回リトライ
  });
}

// データ更新用フック
function useUpdatePOI() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePOI,
    // 楽観的更新の実装
    onMutate: async (newPOI) => {
      // 関連クエリを一時的に無効化
      await queryClient.cancelQueries({ queryKey: ['pois'] });
      
      // 以前の状態をスナップショット
      const previousPOIs = queryClient.getQueryData(['pois']);
      
      // 楽観的に新しい状態を設定
      queryClient.setQueryData(['pois'], (old: any) => 
        old.map((poi: any) => poi.id === newPOI.id ? newPOI : poi)
      );
      
      // ロールバック用に以前の状態を返す
      return { previousPOIs };
    },
    
    // エラー時の回復処理
    onError: (err, newPOI, context) => {
      queryClient.setQueryData(['pois'], context?.previousPOIs);
      console.error('POI更新に失敗しました:', err);
    },
    
    // 成功または失敗後、関連データを再検証
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
  });
}
```

### オフラインサポートの実装

#### Service WorkerとIndexedDB連携
- **ネットワーク状態に応じたフォールバック**: オンライン・オフラインの適切な切り替え
- **バックグラウンド同期による遅延更新**: オフライン時の操作を後で同期
- **キャッシュ優先戦略とストレージ容量管理**: 限られたリソースの効率的な活用

```typescript
// オフライン対応POIデータアクセス
import { openDB } from 'idb';
import { isOnline } from '@/utils/network';

// IndexedDBセットアップ
const initDB = async () => {
  return openDB('poi-db', 1, {
    upgrade(db) {
      db.createObjectStore('pois', { keyPath: 'id' });
      db.createObjectStore('sync-queue');
    }
  });
};

// ネットワーク状態を考慮したデータ取得
export async function getPOIs(category?: string) {
  // オンライン時はAPIからデータ取得し、ローカルDBに保存
  if (isOnline()) {
    try {
      const data = await fetchFromAPI(`/pois?category=${category || ''}`);
      const db = await initDB();
      const tx = db.transaction('pois', 'readwrite');
      
      // カテゴリ別にデータをキャッシュ
      data.forEach(poi => tx.store.put(poi));
      await tx.done;
      
      return data;
    } catch (err) {
      console.warn('APIからの取得に失敗、ローカルデータにフォールバック', err);
      // APIエラー時はローカルデータにフォールバック
    }
  }
  
  // オフラインまたはAPI失敗時はIndexedDBから取得
  const db = await initDB();
  let pois = await db.getAll('pois');
  
  // カテゴリフィルタリングをクライアントサイドで実行
  if (category) {
    pois = pois.filter(poi => poi.category === category);
  }
  
  return pois;
}

// オフライン時の更新をキューに追加
export async function updatePOIWithOfflineSupport(poi) {
  const db = await initDB();
  
  // ローカルDBを即時更新
  await db.put('pois', poi);
  
  // オンライン時は直接API更新
  if (isOnline()) {
    return await updatePOIToAPI(poi);
  }
  
  // オフライン時は同期キューに追加
  await db.put('sync-queue', {
    id: `update-${Date.now()}`,
    action: 'update',
    payload: poi,
    timestamp: Date.now()
  });
  
  // Service Workerに同期イベントを登録
  if ('serviceWorker' in navigator && 'sync' in registration) {
    try {
      await registration.sync.register('sync-pois');
    } catch (err) {
      console.error('バックグラウンド同期の登録に失敗:', err);
    }
  }
  
  return poi;
}
```

## 5. ユーザーインターフェース最適化

### CSS戦略と視覚的一貫性

#### モダンなスタイリングアプローチ
- **CSS-in-JSとTailwind CSSの併用戦略**
  - コンポーネントに閉じたスタイルとユーティリティファーストの組み合わせ
  - 動的スタイリングとテーマ切り替えの実装
  - パフォーマンスを考慮したコード分割とCSS生成

```typescript
// Tailwind + Emotion/Styled Componentsの組み合わせ例
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import tw from 'twin.macro'; // Tailwindとの橋渡し

// ベースコンポーネントにTailwindクラスを適用
const Card = styled.div`
  ${tw`bg-white rounded-lg shadow-md p-4 m-2`}
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    ${tw`shadow-lg`}
    transform: translateY(-2px);
  }
`;

// 条件付きスタイリング
const POICard = styled(Card)<{ isSelected: boolean; category: string }>`
  ${({ isSelected }) => isSelected && tw`ring-2 ring-blue-500`}
  
  ${({ category }) => {
    switch (category) {
      case 'restaurant':
        return tw`border-l-4 border-orange-500`;
      case 'attraction':
        return tw`border-l-4 border-green-500`;
      case 'facility':
        return tw`border-l-4 border-blue-500`;
      default:
        return tw`border-l-4 border-gray-300`;
    }
  }}
  
  // 特定の要素のスタイリング
  .card-header {
    ${tw`flex justify-between items-center mb-2`}
  }
  
  .card-title {
    ${tw`text-lg font-semibold text-gray-800`}
  }
  
  .card-subtitle {
    ${tw`text-sm text-gray-600`}
  }
`;

// モバイル最適化コンポーネント
const MobileView = styled.div`
  ${tw`md:hidden`} // モバイルのみ表示
  
  /* モバイル特有のスタイル */
  .mobile-action-bar {
    ${tw`fixed bottom-0 left-0 right-0 bg-white shadow-up flex justify-around py-2`}
    z-index: 100;
  }
`;

// レスポンシブレイアウト
const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
```

#### アニメーションとトランジションの最適化
- **パフォーマンス重視のアニメーション設計**
  - CSS propertiesによる最適化（`transform`と`opacity`の優先使用）
  - 複雑なアニメーションの適切な実装方法
  - モバイルデバイスでのバッテリー消費を考慮した制御

```typescript
// パフォーマンス最適化されたアニメーション例
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLowPowerMode } from '@/hooks/usePowerMode';

// ローパワーモード検出フック
function POIMarkerAnimation({ poi, isSelected }) {
  const isLowPower = useLowPowerMode();
  const [isVisible, setIsVisible] = useState(false);
  
  // 表示領域に入った時のみアニメーション
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    observer.observe(document.getElementById(`marker-${poi.id}`));
    return () => observer.disconnect();
  }, [poi.id]);
  
  // デバイス性能に応じたアニメーション設定
  const animationVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        // 省電力モード時は簡易アニメーション
        type: isLowPower ? 'tween' : 'spring',
        duration: isLowPower ? 0.2 : undefined,
        stiffness: isLowPower ? undefined : 100
      }
    },
    selected: {
      scale: 1.1,
      y: -5,
      transition: { type: 'spring', stiffness: 300 }
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        id={`marker-${poi.id}`}
        className="poi-marker"
        initial="hidden"
        animate={isVisible 
          ? isSelected ? "selected" : "visible"
          : "hidden"
        }
        variants={animationVariants}
        // GPU高速化のためにwillChangeを指定
        style={{ 
          willChange: 'transform, opacity',
          // ハードウェアアクセラレーション強制
          transform: 'translateZ(0)'
        }}
      >
        <MarkerIcon category={poi.category} />
      </motion.div>
    </AnimatePresence>
  );
}
```

## 6. フレームワーク連携と最適化戦略

### Next.jsとの連携手法

#### App Routerの効果的な活用
- **サーバーとクライアントの適切な使い分け**: コンポーネントの役割に応じた配置
- **レイアウト共有による効率的なルーティング**: 共通UI要素の最適配置
- **並列ルートとインターセプトルート**: 高度なルーティングパターンの実装

```typescript
// Next.jsのApp Router構造の最適化例
// app/map/[category]/page.tsx
import { Suspense } from 'react';
import { MapContainer } from '@/components/MapContainer';
import { POIList } from '@/components/POIList';
import { CategoryNavigation } from '@/components/CategoryNavigation';
import { POIDetailsSheet } from '@/components/POIDetailsSheet';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

// メタデータの動的生成
export async function generateMetadata({ params }: { params: { category: string } }) {
  const category = params.category;
  return {
    title: `${getCategoryName(category)} | 佐渡で食えっちゃマップ`,
    description: `佐渡島の${getCategoryName(category)}スポットを探索`,
  };
}

// SSG用のパラメータ生成
export async function generateStaticParams() {
  return [
    { category: 'restaurant' },
    { category: 'snack' },
    { category: 'recommend' }
  ];
}

export default function CategoryMapPage({ params }: { params: { category: string } }) {
  return (
    <main className="map-page">
      <CategoryNavigation currentCategory={params.category} />
      
      {/* マップコンテナは即時表示 */}
      <MapContainer initialCategory={params.category} />
      
      {/* POIリストは並行して読み込み、準備できたら表示 */}
      <Suspense fallback={<LoadingSkeleton type="poi-list" />}>
        <POIList category={params.category} />
      </Suspense>
      
      {/* 詳細情報は必要時に表示 */}
      <POIDetailsSheet />
    </main>
  );
}
```

### Remixとの連携手法

#### リソースルートを活用したデータロード最適化
- **データ読み込みと状態管理の統合**: サーバーとクライアントの効率的な連携
- **ハイブリッドレンダリング**: 最適なユーザー体験のための戦略
- **エラー回復メカニズム**: 安定したアプリケーション動作の確保

```typescript
// Remix + SPAスタイルのデータローディング実装
// routes/map.tsx (レイアウトルート)
// ...existing code...
```

### Viteビルド最適化

#### 依存関係最適化とチャンキング戦略
- **効率的なコード分割**: 必要なコードだけを必要なときに読み込む
- **ビルド出力の最適化**: パフォーマンスを考慮したファイル構成
- **キャッシュ戦略**: リソースの効率的な再利用

```typescript
// vite.config.ts 最適化設定
// ...existing code...
```