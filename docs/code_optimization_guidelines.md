# コード最適化ガイドライン

> **最終更新日**: 2025年4月17日  
> **バージョン**: 1.4.0  
> **作成者**: 佐渡で食えっちゃプロジェクトチーム

## 目次

- [1. 最適化の基本理念](#1-最適化の基本理念)
  - [プロジェクトの最適化目標](#プロジェクトの最適化目標)
  - [バランスの取れた改善アプローチ](#バランスの取れた改善アプローチ)
  - [最適化の優先順位付け](#最適化の優先順位付け)
- [2. コード構造と設計原則](#2-コード構造と設計原則)
  - [保守性と拡張性の確保](#保守性と拡張性の確保)
  - [コンポーネント設計の原則](#コンポーネント設計の原則)
  - [データフローの最適化](#データフローの最適化)
  - [Zustand状態管理のベストプラクティス](#zustand状態管理のベストプラクティス)
  - [パスエイリアスの効果的活用](#パスエイリアスの効果的活用)
- [3. パフォーマンス最適化技術](#3-パフォーマンス最適化技術)
  - [React特有の最適化手法と効率的なレンダリング](#react特有の最適化手法と効率的なレンダリング)
  - [Suspenseパターンの活用](#suspenseパターンの活用)
- [4. API管理とデータフェッチング戦略](#4-api管理とデータフェッチング戦略)
  - [モダンなデータフェッチング手法](#モダンなデータフェッチング手法)
  - [オフラインサポートとエラー回復戦略](#オフラインサポートとエラー回復戦略)
- [5. ユーザーインターフェース最適化](#5-ユーザーインターフェース最適化)
  - [CSS戦略と視覚的一貫性](#css戦略と視覚的一貫性)
  - [アニメーションの最適化](#アニメーションの最適化)
- [6. ビルドと依存関係の最適化](#6-ビルドと依存関係の最適化)
  - [効率的なビルド設定](#効率的なビルド設定)
  - [パフォーマンス監視と最適化](#パフォーマンス監視と最適化)
- [7. 実用的なリファレンス](#7-実用的なリファレンス)
  - [パフォーマンス計測ユーティリティ](#パフォーマンス計測ユーティリティ)
  - [高度なデバッグテクニック](#高度なデバッグテクニック)
- [8. 推奨プラクティスチェックリスト](#8-推奨プラクティスチェックリスト)
- [9. エラーハンドリングとロギング連携](#9-エラーハンドリングとロギング連携)
  - [エラー境界とロガーの統合](#エラー境界とロガーの統合)
  - [エラー監視と回復](#エラー監視と回復)
- [参考リンク](#参考リンク)

> **関連ドキュメント**
>
> - [ロガー使用ガイドライン](./logger_usage_guidelines.md) - パフォーマンス計測とロギングの統合方法
> - [環境変数管理ガイドライン](./env_usage_guidelines.md) - 環境別最適化設定の管理
> - [Google Maps ガイドライン](./google_maps_guidelines/index.md) - Google Maps機能の実装と最適化

---

## 【静的サイト前提の運用方針】

本プロジェクトは「ローカル開発（https://localhost）で検証し、満足できたらGitHub Pages等の静的ホスティングで公開する」ことを前提としています。

### 静的サイト前提で維持すべきポイント

1. **Viteの`server`や`proxy`設定はローカル開発専用**
   - 本番ビルド・公開時（GitHub Pages等）には不要。設定ファイルやガイドラインで明記する。
2. **APIサーバーやSSR（サーバーサイドレンダリング）を前提としない設計**
   - fetch先は相対パスや静的ファイルのみを想定。
3. **READMEやガイドラインに「静的サイト運用前提」と明記**
   - 新規参加者や将来の自分が迷わないようにする。
4. **静的サイトで動作しない機能（サーバーサイドAPI、WebSocket等）は導入しない**
   - 必要な場合は「静的サイト運用では利用不可」と明記し、分岐や代替案を検討。
5. **公開・デプロイ手順も静的サイト向けに統一**
   - 例：`dist`フォルダをGitHub Pagesにアップロード。CI/CDも静的ファイルのみをデプロイする形に。

---

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
- コンポジション優先：継承よりもコンポジションを活用した柔軟な設計

### コンポーネント設計の原則

- 宣言的UIパターン：命令型より宣言型のコーディング
- 適切なサイズのコンポーネント分割
- props down, events up の単方向データフロー
- 再利用可能なコンポーネント設計
- 制御されたコンポーネントと非制御コンポーネントの適切な使い分け

### データフローの最適化

- 状態管理の一元化：コンポーネント間で共有される状態を明確に定義
- 不要な再レンダリングの防止：必要な場合のみ再レンダリングが発生する設計
- データ取得と表示ロジックの分離：関心の分離による保守性向上
- キャッシュ戦略の適用：同じデータの再取得を回避
- イミュータブルデータ処理：予測可能な状態変更の実装

### Zustand状態管理のベストプラクティス

- **スライスパターン**: 大規模アプリケーション向けのストア分割設計
- **セレクタの最適化**: 必要最小限のデータだけを購読し再レンダリングを制御
- **永続化とミドルウェア**: 永続化とデバッグ用のミドルウェア統合
- **TypeScript型安全性**: 完全な型支援によるエラー防止
- **DevTools連携**: Redux DevToolsと連携したデバッグ体験の向上

```typescript
// Zustand状態管理の簡略実装例
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// ストア作成
export const usePOIStore = create<POIState>()(
  devtools(
    persist(
      (set, get) => ({
        pois: [],
        selectedPOI: null,
        isLoading: false,

        fetchPOIs: async category => {
          set({ isLoading: true });
          try {
            const data = await fetchPOIData(category);
            set({ pois: data, isLoading: false });
          } catch (error) {
            set({ error, isLoading: false });
          }
        },

        selectPOI: id =>
          set({ selectedPOI: get().pois.find(p => p.id === id) || null }),
      }),
      { name: 'poi-storage' }
    )
  )
);

// 最適化されたセレクタ使用例
const selectedPOI = usePOIStore(state => state.selectedPOI); // 必要な状態のみ購読
const isLoading = usePOIStore(state => state.isLoading); // 別の状態を分離して購読
```

### パスエイリアスの効果的活用

- プロジェクトで定義されているパスエイリアス：
  - `@/*` → `src/*`
- 新規ファイル作成時は常にエイリアスを使用
- インポート群のアルファベット順配置
- 相対パスの複雑な参照（`../../../`など）の排除

## 3. パフォーマンス最適化技術

### React特有の最適化手法と効率的なレンダリング

- **メモ化戦略**: React.memo、useMemo、useCallbackの適切な使用
- **仮想化リスト**: 大量データ表示時のwindowingテクニック
- **コード分割**: React.lazyとSuspenseによる遅延ロード
- **Web Vitals監視**: コアWeb指標（CLS、FID、LCP）の継続的な監視と最適化
- **React 19の新機能活用**: Actions API、useTransition、サスペンスベースのローディングパターン
- **適切なキー設計**: リスト要素の効率的な差分更新を可能にするユニークなキー
- **不要な再レンダリングの特定**: React DevTools Profilerを用いたボトルネック検出
- **レンダリングバッチの適正化**: 複数更新の一括処理
- **レイアウトシフトの防止**: コンテンツの読み込み中のスペースリザベーション
- **先行ロード戦略**: ユーザーが必要とする前にリソースを先読み

```typescript
// React 19のActions APIの簡略例
import { useFormAction, useFormState } from 'react';

// Action定義
const saveAction = async (prevState, formData: FormData) => {
  try {
    await savePoiToDatabase({
      name: formData.get('name') as string,
      category: formData.get('category') as string
    });
    return { success: true, message: '保存に成功しました' };
  } catch (error) {
    return { success: false, message: 'データの保存に失敗しました' };
  }
};

// コンポーネント内での使用
function POIForm() {
  const [formState, formAction] = useFormState(saveAction, { success: false, message: null });

  return (
    <form action={formAction}>
      <input name="name" required />
      <input name="category" required />
      <button type="submit">保存</button>
      {formState.message && (
        <div className={formState.success ? 'success' : 'error'}>
          {formState.message}
        </div>
      )}
    </form>
  );
}
```

> **注意**: React 19の機能は本ガイドライン執筆時点（2025年4月）では一部APIが変更される可能性があります。最新のAPIドキュメントを参照して実装してください。

````

### Suspenseパターンの活用

- **宣言的なローディング状態**: コンポーネント境界でのローディングUI定義
- **並列データフェッチング**: 複数のデータソースを並行して読み込み
- **段階的なUI表示**: 重要なコンテンツから順次表示する戦略
- **Data Fetchingとの統合**: React 19のuse hookによる洗練されたデータフェッチング

```typescript
// Suspenseパターンの簡略例
import { Suspense, lazy, use } from 'react';

const POIDetails = lazy(() => import('@/components/POIDetails'));

// データの取得と変換
function fetchPOIResource(category) {
  const promise = fetch(`/api/pois/${category}`)
    .then(res => res.json());
  return { read: () => use(promise) };
}

function POIMap({ category }) {
  const poiResource = fetchPOIResource(category);

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
````

## 4. API管理とデータフェッチング戦略

### モダンなデータフェッチング手法

- **自動キャッシュとリフェッチ**: 賢いキャッシュ戦略によるデータ鮮度の確保
- **楽観的UI更新とエラー回復**: ユーザー体験を損なわないデータ更新
- **リクエスト重複排除とバックグラウンド更新**: パフォーマンス向上と最新データの提供
- **無限クエリとページネーション**: 大量データの効率的な表示
- **リアクティブクエリインバリデーション**: 関連データの自動更新

```typescript
// TanStack Queryの簡略例
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// データ取得用フック
function usePOIData(category: string | undefined) {
  return useQuery({
    queryKey: ['pois', { category }],
    queryFn: () => fetchPOIs(category),
    staleTime: 5 * 60 * 1000, // 5分間はキャッシュを最新とみなす
    retry: 2, // 失敗時に2回リトライ
    placeholderData: previousData => previousData, // 以前のデータを再利用
  });
}

// データ更新用フック（楽観的UI更新付き）
function useUpdatePOI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePOI,
    onMutate: async newPOI => {
      // 楽観的更新のために現在のクエリを一時停止
      await queryClient.cancelQueries({ queryKey: ['pois'] });

      // 以前の値をスナップショット
      const previousPOIs = queryClient.getQueryData(['pois']);

      // 楽観的に値を更新
      queryClient.setQueryData(['pois'], old => {
        return old.map(poi => (poi.id === newPOI.id ? newPOI : poi));
      });

      return { previousPOIs };
    },
    onError: (err, newPOI, context) => {
      // エラー時に元に戻す
      queryClient.setQueryData(['pois'], context.previousPOIs);
    },
    onSettled: () => {
      // 操作が完了したらクエリを更新
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
  });
}
```

### オフラインサポートとエラー回復戦略

- **ネットワーク状態に応じたフォールバック**: オンライン・オフラインの適切な切り替え
- **バックグラウンド同期による遅延更新**: オフライン時の操作を後で同期
- **キャッシュ優先戦略とストレージ容量管理**: 限られたリソースの効率的な活用
- **IndexedDBを活用したデータ永続化**: 大容量データの効率的なオフライン保存
- **Service Workerによるリソースキャッシング**: ネットワーク非依存の基本機能提供
- **段階的なデータ取得フォールバック**: ネットワークエラー時に複数の回復手段を順次試行

```typescript
// オフラインサポートと段階的回復戦略の実装例
import { useNetworkState } from '@/hooks/useNetworkState';
import { useIndexedDBStore } from '@/hooks/useIndexedDBStore';
import { logger } from '@/utils/logger';

function POIListWithOfflineSupport({ category }) {
  const { isOnline } = useNetworkState();
  const { query, save, pendingChanges, syncPendingChanges } = useIndexedDBStore('pois');

  // オンラインに戻ったときに保留中の変更を同期
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      syncPendingChanges().then(() => {
        toast.success('変更がサーバーに同期されました');
      });
    }
  }, [isOnline, pendingChanges.length]);

  // データ取得エラー時の段階的回復処理
  const handleFetchError = async (error) => {
    logger.warn('POIデータ取得エラー、キャッシュにフォールバック', { error });

    // 1. キャッシュからデータを取得
    const cachedData = await query.getCached();
    if (cachedData?.length > 0) {
      return cachedData;
    }

    // 2. 一般カテゴリのデータを取得
    logger.warn('キャッシュが利用できないため一般カテゴリを使用');
    return fetchGeneralCategory();
  };

  // UI内でオフライン状態を表示
  return (
    <div>
      {!isOnline && <OfflineBanner pendingCount={pendingChanges.length} />}
      <POIList
        data={query.data}
        isLoading={query.isLoading}
        onError={handleFetchError}
      />
    </div>
  );
}
```

## 5. ユーザーインターフェース最適化

### CSS戦略と視覚的一貫性

- **CSS-in-JSとTailwind CSSの併用戦略**: コンポーネントスコープのスタイルとユーティリティの組み合わせ
- **動的スタイリングとテーマ切り替え**: 一貫したデザインシステム
- **パフォーマンスを考慮したスタイル適用**: CSS生成の最適化
- **アトミックCSS設計**: 再利用可能な小さなスタイル単位の構築
- **CSSセレクタの最適化**: 高速なレンダリングのためのシンプルなセレクタ

```typescript
// スタイリング手法の簡略例
import styled from '@emotion/styled';
import tw, { theme } from 'twin.macro';

// ベースコンポーネント
const Card = styled.div`
  ${tw`bg-white rounded-lg shadow-md p-4 m-2`}

  &:hover {
    ${tw`shadow-lg`}
    transform: translateY(-2px);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  // メディアクエリの適用
  @media (max-width: ${theme`screens.md`}) {
    ${tw`p-3 m-1`}
  }
`;

// 条件付きスタイリング
const POICard = styled(Card)<{
  isSelected: boolean;
  importance: 'high' | 'medium' | 'low';
}>`
  ${({ isSelected }) => isSelected && tw`ring-2 ring-blue-500`}

  // 重要度に基づくスタイリング
  ${({ importance }) =>
    importance === 'high'
      ? tw`border-l-4 border-red-500`
      : importance === 'medium'
        ? tw`border-l-4 border-yellow-500`
        : tw`border-l-4 border-gray-300`}
`;
```

### アニメーションの最適化

- **パフォーマンス重視のアニメーション**: transform/opacityの優先使用
- **条件付きアニメーション**: デバイス性能に応じた調整
- **インタラクション設計**: ユーザー操作に対する視覚的フィードバック
- **プログレッシブエンハンスメント**: 基本機能の保証と高度な視覚効果の段階的な追加
- **アクセシビリティ考慮**: reduced-motion対応

```typescript
// パフォーマンスとアクセシビリティを考慮したアニメーション
import { useReducedMotion } from '@/hooks/useReducedMotion';

function FadeInSection({ children, delay = 0 }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });

    observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  // アクセシビリティ設定に応じてアニメーションを調整
  const animationStyle = prefersReducedMotion
    ? {} // アニメーションなし
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.4s ease-in-out, transform 0.4s ease-in-out ${delay}s`
      };

  return (
    <div ref={domRef} style={animationStyle}>
      {children}
    </div>
  );
}
```

## 6. ビルドと依存関係の最適化

### 効率的なビルド設定

- **コード分割と遅延ロード**: 必要なコードだけを必要なときにロード
- **依存関係の最適化**: 使用しないコードの削除
- **キャッシュ戦略**: 効率的なリソース再利用
- **モジュールフェデレーション**: 複数アプリケーション間でのコード共有
- **ビルド時最適化**: 事前レンダリングと静的サイト生成の活用

````typescript
// Vite設定の簡略例
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

export default defineConfig({
  plugins: [
    react(),
    chunkSplitPlugin({
      strategy: 'default',
      customSplitting: {
        'map-chunk': [/[\\/]components[\\/]map[\\/]/],
        'vendor-react': ['react', 'react-dom'],
      },
    }),
    // バンドル分析レポートを生成
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
    }),
  ],

  build: {
    target: 'esnext', // 最新ブラウザをターゲット
    minify: 'terser', // 高度な圧縮
    cssCodeSplit: true, // CSSの分割
    sourcemap: false, // 本番環境ではソースマップを無効化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
          map: ['leaflet', 'react-leaflet'],
          ui: ['@emotion/react', '@emotion/styled', 'twin.macro'],
        },
      },
    },
    // キャッシュ最適化
    commonjsOptions: {
      include: [/node_modules/],
    },
    // 不要なコードの削除
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

> **重要**: 開発サーバー設定と静的ホスティングについての詳細な情報は、[静的サイト前提の運用方針](#静的サイト前提の運用方針)セクションを参照してください。

## 7. 実用的なリファレンス

### パフォーマンス計測ユーティリティ

```typescript
// パフォーマンス計測のためのラッパー関数
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  // ロガーを活用したパフォーマンス計測
  return logger.measureTimeAsync(name, fn, LogLevel.DEBUG, {
    component: 'PerformanceMonitor',
  });
};

// 同期処理用のパフォーマンス計測
export const measureSyncPerformance = <T>(name: string, fn: () => T): T => {
  const startTime = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - startTime;

    logger.debug(`${name} 完了`, {
      duration: `${duration.toFixed(2)}ms`,
      component: 'PerformanceMonitor',
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`${name} 失敗`, {
      duration: `${duration.toFixed(2)}ms`,
      error,
      component: 'PerformanceMonitor',
    });
    throw error;
  }
};

// 使用例
const data = await measurePerformance('POIデータのフェッチと変換', () =>
  fetchAndTransformPOIs(category)
);

const processedData = measureSyncPerformance('POIデータの処理', () =>
  processPOIData(data)
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
      timestamp: new Date().toISOString(),
    });
  });
}

// コンポーネントの再レンダリング理由を追跡
export function useWhyDidYouUpdate(
  componentName: string,
  props: Record<string, any>
): void {
  const previousProps = useRef<Record<string, any>>({});

  useEffect(() => {
    if (previousProps.current) {
      const changedProps: Record<string, { from: any; to: any }> = {};
      let hasChanges = false;

      Object.entries(props).forEach(([key, value]) => {
        if (previousProps.current[key] !== value) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: value,
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        logger.debug(`${componentName}の再レンダリング理由:`, {
          component: componentName,
          changedProps,
          timestamp: new Date().toISOString(),
        });
      }
    }

    previousProps.current = props;
  });
}

// 使用例
function ExpensiveComponent(props) {
  useRenderCounter('ExpensiveComponent');
  useWhyDidYouUpdate('ExpensiveComponent', props);

  // コンポーネントのロジック...
}
```

## 8. 推奨プラクティスチェックリスト

### コンポーネントとデータ管理

- [x] **コンポーネント設計**: 単一責任の原則に基づいた適切なサイズのコンポーネント
- [x] **状態管理**: Zustandでの最適化されたストア設計とセレクタ使用
- [x] **メモ化**: 適切なメモ化戦略による不要な再計算・再レンダリングの防止

### 堅牢性と性能

- [x] **エラー境界**: 堅牢なエラー処理とフォールバックUI
- [x] **パフォーマンス計測**: ロガーと連携した処理時間計測
- [x] **コード分割**: 効率的なバンドルサイズ管理
- [x] **Web Vitals最適化**: コアWeb指標の継続的な測定と改善

### ユーザー体験と品質保証

- [x] **アクセシビリティ**: スクリーンリーダー対応、キーボードナビゲーション、色コントラスト最適化
- [x] **オフライン対応**: ServiceWorkerとIndexedDBを活用したオフライン機能実装
- [x] **テスト自動化**: 単体テスト、統合テスト、E2Eテストによる品質保証

> **重要**: これらのプラクティスは「佐渡で食えっちゃプロジェクト」全体に適用し、継続的に改善していくこと。新機能開発時にも必ずこのチェックリストを参照してください。

## 9. エラーハンドリングとロギング連携

### エラー境界とロガーの統合

エラー境界とロガーを連携させることで、ユーザー体験を損なわずにエラー情報を収集できます。

```typescript
// ErrorBoundaryコンポーネントとロガーの統合例
import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface ErrorBoundaryProps {
  fallback: ReactNode | ((error: Error) => ReactNode);
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // logger_usage_guidelines.mdで説明されているエラーロギング方針を適用
    logger.error('コンポーネントレンダリングエラー', {
      error,
      componentStack: errorInfo.componentStack,
      component: 'ErrorBoundary',
    });

    // カスタムエラーハンドラーがあれば呼び出す
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (typeof fallback === 'function' && this.state.error) {
        return fallback(this.state.error);
      }
      return fallback;
    }

    return this.props.children;
  }
}
```

### エラー監視と回復

エラー発生時には段階的な回復戦略を実装することで、ユーザー体験を最大限に保護します。

- **キャッシュを活用したフォールバック**: APIリクエストが失敗した場合、まずローカルキャッシュからデータを試行
- **カテゴリフォールバック**: 特定カテゴリのデータが取得できない場合は汎用カテゴリにフォールバック
- **空の結果セットによる安全な失敗**: 全ての回復手段が失敗した場合でもアプリケーションのクラッシュを防止
- **環境に応じたエラー表示**: 開発環境では詳細なエラー情報、本番環境ではユーザーフレンドリーなメッセージ

> **注意**: パフォーマンス計測とエラー処理を組み合わせる場合は、[パフォーマンス計測ユーティリティ](#パフォーマンス計測ユーティリティ)セクションのユーティリティを活用してください。ロガーとの連携方法については[ロガー使用ガイドライン](./logger_usage_guidelines.md)を参照してください。
```

## 参考リンク

### 基本概念

- [Zustand公式ドキュメント](https://github.com/pmndrs/zustand) - 状態管理ライブラリの完全ガイド
- [React公式ドキュメント](https://react.dev/reference/react) - React APIリファレンス
- [Vite最適化ガイド](https://vitejs.dev/guide/performance.html) - Viteのパフォーマンス最適化

### 実装テクニック

- [ReactパフォーマンスTips](https://react.dev/learn/render-and-commit) - レンダリングプロセスの理解
- [Reactパターン集](https://reactpatterns.com/) - モダンなReactパターンの解説
- [TanStack Query](https://tanstack.com/query/latest) - データフェッチング最適化
- [Emotion + Tailwindの統合](https://github.com/ben-rogerson/twin.macro) - CSS-in-JSとユーティリティの組み合わせ

### 最新機能とAPIリファレンス

- [React 19 Actions APIガイド](https://react.dev/reference/react/useActionState) - フォーム処理の新アプローチ
- [Suspenseパターン解説](https://react.dev/reference/react/Suspense) - 宣言的なローディング状態の実装
- [useTransitionの活用法](https://react.dev/reference/react/useTransition) - 応答性の高いUI作成

### テストと監視

- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) - Webアプリのパフォーマンス分析ツール
- [Web Vitals](https://web.dev/explore/vitals) - コアWeb指標の測定と改善
- [React Profiler API](https://react.dev/reference/react/Profiler) - Reactアプリのパフォーマンス計測

### 実践的事例と応用

- [Reactパフォーマンス最適化事例](https://javascript.plainenglish.io/improving-performance-in-react-applications-e9d22faeff0) - 実際のアプリケーション最適化例
- [PWAベストプラクティス](https://web.dev/learn/pwa/) - オフライン対応とモバイル最適化
- [大規模Reactアプリの設計パターン](https://blog.openreplay.com/react-architectural-patterns-for-large-applications/) - エンタープライズ規模のアーキテクチャ

### 日本語リソース

- [Reactパフォーマンス最適化入門](https://zenn.dev/takuyakikuchi/articles/9e1151ed8b9282) - 日本語でのReactパフォーマンス解説
- [Vite実践ガイド](https://ja.vitejs.dev/guide/performance.html) - 日本語でのVite最適化ガイド
- [TypeScript設計パターン](https://qiita.com/uhyo/items/e2fdef2d3236b9bfe74a) - TypeScriptによるコード設計の実践
````
