/**
 * POI（Point of Interest）状態管理モジュール
 *
 * Zustandベースの状態管理を使用し、POI関連のデータを管理します。
 * スライスパターンを採用し、状態とアクションを明確に分離しています。
 * セレクタの最適化とpersistミドルウェアにより、パフォーマンスと永続性を確保しています。
 *
 * @version 1.1.0
 * @updated 2025-04-24
 */
import { useCallback } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { usePOIConverter } from '@/hooks/usePOIConverter';
import { usePOIData } from '@/hooks/usePOIData';
import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

// ----- 状態スライス定義 -----

/**
 * POI状態のスライス - データと状態のみを保持
 */
interface POIState {
  /** POIデータの配列 */
  pois: PointOfInterest[];
  /** 現在選択されているPOI */
  selectedPOI: PointOfInterest | null;
  /** データロード中フラグ */
  isLoading: boolean;
  /** エラー状態 */
  error: string | null;
  /** 最後のデータ更新時刻 */
  lastUpdated: number | null;
}

/**
 * POIアクションのスライス - 操作とビジネスロジックのみを保持
 */
interface POIActions {
  /** POIを選択する */
  selectPOI: (poi: PointOfInterest) => void;
  /** POI選択をクリアする */
  clearSelectedPOI: () => void;
  /** POIデータをストアに設定する */
  setPOIs: (pois: PointOfInterest[]) => void;
  /** エラー状態を設定する */
  setError: (error: string | null) => void;
  /** ローディング状態を設定する */
  setLoading: (isLoading: boolean) => void;
  /** データ取得を再試行する（エラー回復用） */
  retryLoadPOIs: () => Promise<void>;
}

/**
 * 完全なPOIストア型 - 状態とアクションの結合
 */
type POIStore = POIState & POIActions;

// ----- ストア実装 -----

/**
 * POI関連の状態管理を一元化するZustandストア
 *
 * persistミドルウェアでデータを永続化し、devtoolsでデバッグを容易にしています。
 */
export const usePOIStore = create<POIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        pois: [],
        selectedPOI: null,
        isLoading: false,
        error: null,
        lastUpdated: null,

        // アクション
        selectPOI: poi => {
          try {
            logger.info('POIが選択されました', { id: poi.id, name: poi.name });
            set({
              selectedPOI: poi,
              lastUpdated: Date.now(),
            });
          } catch (error) {
            logger.error('POI選択中にエラーが発生しました', { error, poiId: poi?.id });
          }
        },

        clearSelectedPOI: () => {
          set({ selectedPOI: null });
        },

        setPOIs: pois => {
          set({
            pois,
            isLoading: false,
            error: null,
            lastUpdated: Date.now(),
          });
          logger.debug('POIデータが更新されました', { count: pois.length });
        },

        setError: error => {
          set({
            error,
            isLoading: false,
          });
          if (error) {
            logger.error('POIストアでエラーが発生しました', { error });
          }
        },

        setLoading: isLoading => {
          set({ isLoading });
        },

        // エラーからの回復を試みるアクション
        retryLoadPOIs: async () => {
          const currentState = get();

          // すでに読み込み中の場合は何もしない
          if (currentState.isLoading) return;

          set({ isLoading: true, error: null });

          try {
            // POIデータのフェッチロジックは実装されていないため、
            // ここではコメントアウトしていますが、実際には実装が必要です
            // const poiData = await fetchPOIData();
            // set({ pois: poiData, isLoading: false, error: null, lastUpdated: Date.now() });

            logger.info('POIデータの再読み込みを試みています');

            // 現時点では何も行わない（実装は別のロジックに依存）
            set({ isLoading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラー';
            logger.error('POIデータ再取得中にエラーが発生しました', { error });
            set({
              error: `データの再取得に失敗しました: ${errorMessage}`,
              isLoading: false,
            });
          }
        },
      }),
      {
        name: 'poi-storage', // ローカルストレージのキー
        partialize: state => ({
          // 永続化する状態を選択（パフォーマンス向上）
          pois: state.pois,
          lastUpdated: state.lastUpdated,
          // selectedPOIは永続化から除外（アプリ再起動時にリセット）
        }),
      }
    ),
    { name: 'poi-store' } // devtools表示名
  )
);

// ----- 最適化されたセレクタ -----

/**
 * 選択されたPOIのみを取得するセレクタ
 * 他の状態が変わっても再レンダリングが発生しません
 */
export const useSelectedPOI = () => usePOIStore(state => state.selectedPOI);

/**
 * POIリストのみを取得するセレクタ
 */
export const usePOIList = () => usePOIStore(state => state.pois);

/**
 * ローディング状態のみを取得するセレクタ
 */
export const usePOILoadingState = () => usePOIStore(state => state.isLoading);

/**
 * エラー状態のみを取得するセレクタ
 */
export const usePOIErrorState = () => usePOIStore(state => state.error);

// ----- 関連ユーティリティフック -----

/**
 * POIデータをロードするためのカスタムフック
 * コンポーネントでのPOIデータ取得を簡略化し、エラーハンドリングを強化
 *
 * @param enabled データ取得を有効にするかどうか
 * @returns データ処理関数
 */
export const useLoadPOIData = (enabled: boolean = true) => {
  const { setPOIs, setError, setLoading } = usePOIStore();
  const { convertPOItoPointOfInterest } = usePOIConverter();

  // POIデータをフェッチするフック
  const { data: rawPois, error: poisError } = usePOIData({ enabled });

  // データ処理と状態更新（useCallbackによるメモ化）
  const processPOIData = useCallback(() => {
    setLoading(true);
    logger.debug('POIデータの処理を開始します');

    if (poisError) {
      logger.error('POIデータの取得に失敗しました', { error: poisError });
      setError(`スポット情報の読み込みに失敗しました: ${poisError}`);
      return;
    }

    try {
      if (rawPois && rawPois.length > 0) {
        logger.debug('POIデータの変換を開始します', { count: rawPois.length });

        const convertedPois = rawPois
          .map(poi => {
            try {
              return convertPOItoPointOfInterest(poi);
            } catch (error) {
              logger.warn('POIの変換中にエラーが発生しました', { error, poi });
              // エラーが発生したPOIはスキップする代わりに、基本情報のみのフォールバックを返す
              return {
                id: poi.id || `unknown-${Date.now()}`,
                name: poi.name || '不明な場所',
                lat: 0,
                lng: 0,
                latitude: 0,
                longitude: 0,
                isClosed: false,
                type: 'other',
                category: 'unspecified',
                address: '',
                searchText: (poi.name || '不明な場所').toLowerCase(),
              } as PointOfInterest;
            }
          })
          // nullやundefinedの可能性を排除
          .filter(Boolean);

        setPOIs(convertedPois);
        logger.info('POIデータの処理が完了しました', {
          count: convertedPois.length,
          timestamp: new Date().toISOString(),
        });
      } else if (rawPois && rawPois.length === 0) {
        logger.info('POIデータが空でした');
        setPOIs([]);
      } else {
        logger.warn('POIデータがnullまたはundefinedです');
        setError('データが取得できませんでした。後でもう一度お試しください。');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      logger.error('POIデータの処理中にエラーが発生しました', { error });
      setError(`データ処理中にエラーが発生しました: ${errorMessage}`);
    }
  }, [rawPois, poisError, setPOIs, setError, setLoading, convertPOItoPointOfInterest]);

  return { processPOIData };
};
