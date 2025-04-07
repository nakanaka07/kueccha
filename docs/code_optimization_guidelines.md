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
// Zustand状態管理の簡略実装例
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ストア作成
export const usePOIStore = create<POIState>()(
  persist(
    (set, get) => ({
      pois: [],
      selectedPOI: null,
      isLoading: false,
      
      fetchPOIs: async (category) => {
        set({ isLoading: true });
        try {
          const data = await fetchPOIData(category);
          set({ pois: data, isLoading: false });
        } catch (error) {
          set({ error, isLoading: false });
        }
      },

      selectPOI: (id) => set({ selectedPOI: get().pois.find(p => p.id === id) || null })
    }),
    { name: 'poi-storage' }
  )
);

// 最適化されたセレクタ使用例
const selectedPOI = usePOIStore(state => state.selectedPOI); // 必要な状態のみ購読
```

### パスエイリアスの効果的活用

- プロジェクトで定義されているパスエイリアス：
  - `@/*` → `src/*`
  - `@/components/*` → `src/components/*` 
  - `@/hooks/*` → `src/hooks/*`
  - `@/utils/*` → `src/utils/*`
- 新規ファイル作成時は常にエイリアスを使用
- インポート群のアルファベット順配置

## 3. パフォーマンス最適化技術

### React特有の最適化手法

- **メモ化戦略**: React.memo、useMemo、useCallbackの適切な使用
- **仮想化リスト**: 大量データ表示時のwindowingテクニック
- **コード分割**: React.lazyとSuspenseによる遅延ロード
- **Web Vitals監視**: コアWeb指標（CLS、FID、LCP）の継続的な監視と最適化
- **React 19の新機能活用**: Actions API、useTransition、サスペンスベースのローディングパターン

```typescript
// React 19のActions APIの簡略例
import { useFormAction } from 'react';

// Action定義
const saveAction = async (formData: FormData) => {
  try {
    await savePoiToDatabase({ 
      name: formData.get('name') as string,
      category: formData.get('category') as string 
    });
    return redirectWithAlert('/pois', '保存に成功しました');
  } catch (error) {
    return { message: 'データの保存に失敗しました' };
  }
};

// コンポーネント内での使用
function POIForm() {
  const formAction = useFormAction(saveAction);
  return <form action={formAction}>...</form>;
}
```

### Suspenseパターンの活用

- **宣言的なローディング状態**: コンポーネント境界でのローディングUI定義
- **並列データフェッチング**: 複数のデータソースを並行して読み込み
- **段階的なUI表示**: 重要なコンテンツから順次表示する戦略

```typescript
// Suspenseパターンの簡略例
import { Suspense, lazy } from 'react';

const POIDetails = lazy(() => import('@/components/POIDetails'));

function POIMap() {
  return (
    <div className="poi-app">
      <MapBase />
      <Suspense fallback={<POIListSkeleton />}>
        <POIList resource={poiResource} />
      </Suspense>
      <Suspense fallback={<DetailsSkeleton />}>
        <POIDetails />
      </Suspense>
    </div>
  );
}
```

## 4. API管理とデータフェッチング戦略

### モダンなデータフェッチング手法

- **自動キャッシュとリフェッチ**: 賢いキャッシュ戦略によるデータ鮮度の確保
- **楽観的UI更新とエラー回復**: ユーザー体験を損なわないデータ更新
- **リクエスト重複排除とバックグラウンド更新**: パフォーマンス向上と最新データの提供

```typescript
// TanStack Queryの簡略例
import { useQuery } from '@tanstack/react-query';

// データ取得用フック
function usePOIData(category: string | undefined) {
  return useQuery({
    queryKey: ['pois', { category }],
    queryFn: () => fetchPOIs(category),
    staleTime: 5 * 60 * 1000,  // 5分間はキャッシュを最新とみなす
    retry: 2                    // 失敗時に2回リトライ
  });
}
```

### オフラインサポートの実装

- **ネットワーク状態に応じたフォールバック**: オンライン・オフラインの適切な切り替え
- **バックグラウンド同期による遅延更新**: オフライン時の操作を後で同期
- **キャッシュ優先戦略とストレージ容量管理**: 限られたリソースの効率的な活用

## 5. ユーザーインターフェース最適化

### CSS戦略と視覚的一貫性

- **CSS-in-JSとTailwind CSSの併用戦略**: コンポーネントスコープのスタイルとユーティリティの組み合わせ
- **動的スタイリングとテーマ切り替え**: 一貫したデザインシステム
- **パフォーマンスを考慮したスタイル適用**: CSS生成の最適化

```typescript
// スタイリング手法の簡略例
import styled from '@emotion/styled';
import tw from 'twin.macro';

const Card = styled.div`
  ${tw`bg-white rounded-lg shadow-md p-4 m-2`}
  
  &:hover {
    ${tw`shadow-lg`}
    transform: translateY(-2px);
  }
`;

// 条件付きスタイリング
const POICard = styled(Card)<{ isSelected: boolean }>`
  ${({ isSelected }) => isSelected && tw`ring-2 ring-blue-500`}
`;
```

### アニメーションの最適化

- **パフォーマンス重視のアニメーション**: transform/opacityの優先使用
- **条件付きアニメーション**: デバイス性能に応じた調整
- **インタラクション設計**: ユーザー操作に対する視覚的フィードバック

## 6. ビルドと依存関係の最適化

### 効率的なビルド設定

- **コード分割と遅延ロード**: 必要なコードだけを必要なときにロード
- **依存関係の最適化**: 使用しないコードの削除
- **キャッシュ戦略**: 効率的なリソース再利用

```typescript
// Vite設定の簡略例
export default defineConfig({
  plugins: [
    react(),
    chunkSplitPlugin({
      strategy: 'default',
      customSplitting: {
        'map-chunk': [/[\\/]components[\\/]map[\\/]/],
        'vendor-react': ['react', 'react-dom']
      }
    })
  ],
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          map: ['leaflet', 'react-leaflet']
        }
      }
    }
  }
});
```

### パフォーマンス監視と最適化

- **Web Vitalsの測定**: コアWeb指標の継続的な監視
- **バンドルサイズ分析**: rollup-plugin-visualizerなどによる可視化
- **ランタイムパフォーマンス監視**: React Developer Toolsのプロファイラー活用

## 7. 実用的なリファレンス

### パフォーマンス計測ユーティリティ

```typescript
// パフォーマンス計測のためのラッパー関数
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  // ロガーを活用したパフォーマンス計測
  return logger.measureTimeAsync(
    name,
    fn,
    LogLevel.DEBUG,
    { component: 'PerformanceMonitor' }
  );
};

// 使用例
const data = await measurePerformance(
  'POIデータのフェッチと変換',
  () => fetchAndTransformPOIs(category)
);
```

### 高度なデバッグテクニック

```typescript
// コンポーネントのレンダリング回数を追跡
export function useRenderCounter(componentName: string): void {
  const renderCount = useRef(0);
  
  useEffect(() => {
    const count = ++renderCount.current;
    logger.debug(`${componentName}がレンダリングされました`, {
      component: componentName,
      renderCount: count,
      timestamp: new Date().toISOString()
    });
  });
}
```

## 8. 推奨プラクティスチェックリスト

- [x] **コンポーネント設計**: 単一責任の原則に基づいた適切なサイズのコンポーネント
- [x] **状態管理**: Zustandでの最適化されたストア設計とセレクタ使用
- [x] **メモ化**: 適切なメモ化戦略による不要な再計算・再レンダリングの防止
- [x] **エラー境界**: 堅牢なエラー処理とフォールバックUI
- [x] **パフォーマンス計測**: ロガーと連携した処理時間計測
- [x] **コード分割**: 効率的なバンドルサイズ管理
- [x] **アクセシビリティ**: 基本的なWCAGガイドライン対応

> **関連ガイドライン**: 
> - [環境変数管理ガイドライン](./env_usage_guidelines.md) - 環境に応じたパフォーマンス設定
> - [ロガー使用ガイドライン](./logger_usage_guidelines.md) - パフォーマンス測定とログ記録
>
> **参考リンク**：
> - [Zustand公式ドキュメント](https://github.com/pmndrs/zustand)
> - [React公式ドキュメント](https://react.dev/reference/react)
> - [Vite最適化ガイド](https://vitejs.dev/guide/performance.html)
