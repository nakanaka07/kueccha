/**
 * Google Maps API用の拡張型定義
 * @types/google.maps に含まれていない最新機能の型定義
 *
 * 環境変数ガイドラインに従い、env.d.tsで定義された型を参照し、
 * ロガーガイドラインに準拠したコンテキスト構造を採用しています。
 *
 * @see ../constants/maps.ts - 実際のAPI設定とマップ設定
 * @see ../utils/env.ts - 環境変数アクセス機能
 * @see ../hooks/useGoogleMaps.ts - Google Maps APIの初期化と管理
 * @see ../../env.d.ts - 環境変数型定義（特にVITE_GOOGLE_MAPS_*系）
 */

// google.maps.marker 名前空間に関する型定義の拡張
declare namespace google.maps {
  /**
   * API バージョン情報
   * @type {string}
   */
  const version: string;

  /**
   * 指定したGoogleマップライブラリを動的にインポート
   * @param libraryName ライブラリ名 ('maps', 'places', 'geometry'など)
   * @returns ロードされたライブラリのPromise
   *
   * @example
   * const { Map } = await google.maps.importLibrary('maps');
   * const mapElement = document.getElementById('map');
   * const map = new Map(mapElement, mapOptions);
   */
  function importLibrary<T = unknown>(libraryName: string): Promise<T>;

  /**
   * Maps APIエラー情報
   * ロガーガイドラインに準拠したエラーコンテキスト構造
   */
  interface MapsApiError extends Error {
    /** エラーコード */
    code?: string;

    /** エラータイプ */
    type?: string;

    /** 関連するリクエスト情報 */
    request?: unknown;
  }

  /**
   * API状態監視のための型
   * ロガーガイドラインに従い、標準コンテキスト項目を含む
   */
  interface MapsApiStatus {
    /** APIがロードされているか */
    isLoaded: boolean;

    /** 現在のAPIバージョン */
    version?: string;

    /** ロードされているライブラリ */
    loadedLibraries?: string[];

    /** 最新のエラー情報 */
    lastError?: MapsApiError | null;

    /** 初期化開始時刻 */
    initStartTime?: number;

    /** 初期化完了時刻 */
    initCompletedTime?: number;

    /** 初期化パフォーマンス情報 */
    performance?: {
      /** 初期化にかかった時間(ms) */
      initDurationMs: number;

      /** マップレンダリングにかかった時間(ms) */
      renderDurationMs?: number;
    };

    /** ロガーコンテキスト統合項目 */
    component?: string;

    /** 実行中のアクション */
    action?: string;

    /** 関連するエンティティID */
    entityId?: string;

    /** 処理結果のステータス */
    status?: 'success' | 'failure' | 'partial';
  }

  /**
   * API使用状況ヘルパー
   * ロギングガイドラインで推奨される情報収集を容易にする
   */
  interface MapsApiUsage {
    /**
     * ライブラリが利用可能かチェック
     * @param libraryName チェックするライブラリ名
     * @returns 利用可能な場合はtrue
     */
    isLibraryAvailable(libraryName: string): boolean;

    /**
     * 現在のAPIバージョンを取得
     * @returns APIバージョン文字列
     */
    getVersion(): string;

    /**
     * API使用状況の診断情報を取得
     * @returns 診断情報オブジェクト
     */
    getDiagnostics(): Record<string, unknown>;

    /**
     * マップパフォーマンス情報を取得
     * @param map 対象のマップインスタンス
     * @returns パフォーマンス指標
     */
    getMapPerformance(map: google.maps.Map): {
      tileCount: number;
      visibleTiles: number;
      renderingTime: number;
    };
  }

  /**
   * マップ操作ユーティリティ型
   * 頻繁に使用されるマップ操作のための便利なメソッド
   */
  interface MapUtils {
    /**
     * 境界ボックスに合わせてマップの表示領域を調整
     * @param map 調整対象のマップ
     * @param bounds 表示したい境界
     * @param padding 境界からのパディング(ピクセル)
     */
    fitBoundsWithPadding(
      map: google.maps.Map,
      bounds: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
      padding: number | google.maps.Padding
    ): void;

    /**
     * 指定した座標にスムーズに移動
     * @param map 移動対象のマップ
     * @param position 移動先の座標
     * @param zoom 設定するズームレベル(省略可)
     * @param duration アニメーション時間(ms)
     */
    smoothPanTo(
      map: google.maps.Map,
      position: google.maps.LatLng | google.maps.LatLngLiteral,
      zoom?: number,
      duration?: number
    ): Promise<void>;

    /**
     * マップ上のすべてのコントロールを設定
     * @param map 設定対象のマップ
     * @param options コントロールオプション
     */
    configureAllControls(
      map: google.maps.Map,
      options: {
        zoomControl?: boolean;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        [key: string]: boolean | undefined;
      }
    ): void;

    /**
     * 現在のマップの状態を取得
     * @param map 対象のマップ
     * @returns 現在のマップ状態
     */
    getMapState(map: google.maps.Map): {
      center: google.maps.LatLngLiteral;
      zoom: number;
      mapTypeId: string;
      heading: number;
      tilt: number;
    };
  }

  namespace marker {
    /** 高度なマーカー要素のオプション */
    interface AdvancedMarkerElementOptions {
      /** マーカーの位置 */
      position?: google.maps.LatLng | google.maps.LatLngLiteral;

      /** マーカータイトル */
      title?: string;

      /** 表示対象のマップ */
      map?: google.maps.Map | null;

      /** マーカーコンテンツ（HTML要素） */
      content?: HTMLElement | null;

      /** マーカーのZインデックス（重なり順） */
      zIndex?: number;

      /** クリッカブルかどうか */
      clickable?: boolean;

      /** ドラッグ可能かどうか */
      draggable?: boolean;

      /** 他のカスタムプロパティ */
      [key: string]: unknown;
    }

    /** 高度なマーカー要素 */
    class AdvancedMarkerElement extends google.maps.MVCObject {
      constructor(options?: AdvancedMarkerElementOptions);

      /** マーカーの位置 */
      position: google.maps.LatLng | google.maps.LatLngLiteral;

      /** マーカーのタイトル */
      title: string | null;

      /** 関連付けられたマップ */
      map: google.maps.Map | null;

      /** マーカーのHTMLコンテンツ */
      content: HTMLElement | null;

      /** コレクション内でのZインデックス（重なり順） */
      zIndex: number | null;

      /** マーカーをクリック可能に設定 */
      clickable: boolean;

      /** マーカーをドラッグ可能に設定 */
      draggable: boolean;

      /** マーカーの可視性を設定 */
      visible: boolean;

      /** マーカーにイベントリスナーを追加 */
      addListener(
        eventName: string,
        handler: (event: Event) => void
      ): google.maps.MapsEventListener;
    }

    /** ピン要素のオプション */
    interface PinElementOptions {
      /** 背景色またはURL */
      background?: string;

      /** ピンに表示するグリフ（文字やアイコン） */
      glyph?: string;

      /** グリフの色 */
      glyphColor?: string;

      /** ピンのスケール（サイズ倍率） */
      scale?: number;

      /** ピンの境界線色 */
      borderColor?: string;
    }

    /** ピン要素 */
    class PinElement {
      constructor(options?: PinElementOptions);

      /** 生成されたHTML要素 */
      element: HTMLElement;
    }
  }
}

/**
 * Google Maps API Loader ライブラリの型の拡張
 */
declare module '@googlemaps/js-api-loader' {
  /**
   * 統一されたエラー型 - MapsApiErrorとの重複を避ける
   * ロガーガイドラインに準拠したエラーコンテキスト構造
   */
  export interface LoaderError extends Error {
    /** エラーコード */
    code?: string;

    /** エラータイプ */
    type?: string;

    /** エラーカテゴリ（詳細なエラー分類） */
    category?: 'NETWORK' | 'API_KEY' | 'PARSING' | 'UNKNOWN';

    /** HTTP応答コード */
    responseCode?: number;

    /** エラーが発生した元のリクエストURL */
    requestUrl?: string;
  }

  export interface LoaderOptions {
    /**
     * APIバージョン設定
     * - 'weekly': 毎週更新される最新版（テスト用）
     * - 'quarterly': 四半期ごとに更新される安定版（推奨）
     * - 'latest': 常に最新版（不安定な場合あり）
     * - 特定バージョン番号（例: '3.48'）
     */
    version?: 'weekly' | 'quarterly' | 'latest' | string;

    /**
     * 読み込むライブラリ
     * - 'core': 基本機能（デフォルト）
     * - 'maps': マップ機能
     * - 'places': 場所検索機能
     * - 'geometry': 幾何学計算機能
     * - 'drawing': 図形描画機能
     * - 'marker': 高度なマーカー機能
     * - 'visualization': 視覚化ツール
     */
    libraries?: Array<
      'core' | 'maps' | 'places' | 'geometry' | 'drawing' | 'marker' | 'visualization'
    >;

    /**
     * Google Maps API キー
     * env.d.tsで定義されたVITE_GOOGLE_API_KEYを使用
     */
    apiKey: string;

    /**
     * マップIDの配列
     * env.d.tsで定義されたVITE_GOOGLE_MAPS_MAP_IDを使用
     */
    mapIds?: string[];

    /**
     * 使用する言語コード
     * - 例: 'en', 'ja', 'fr'
     */
    language?: string;

    /**
     * 地域コード
     * - 例: 'US', 'JP', 'FR'
     */
    region?: string;

    /**
     * エラーハンドリング方法
     * - 'auto': 標準的なエラー処理（デフォルト）
     * - 'ignore': エラーを無視して続行
     * - 'LATEST': 最新バージョンへのフォールバック
     */
    errorHandling?: 'auto' | 'ignore' | 'LATEST';

    /**
     * チャネル名（API使用状況の追跡用）
     */
    channel?: string;

    /**
     * 認証パラメータ（Enterprise/Premium アカウント用）
     */
    auth?: Record<string, string>;

    /**
     * その他のオプション
     */
    [key: string]: unknown;

    /**
     * APIキー検証オプション
     * env.d.tsおよびutils/env.tsのvalidateEnvironment()関数と連携
     */
    apiKeyValidation?: ApiKeyValidationOptions;

    /**
     * ローダー進捗イベントハンドラ
     * @param event 進捗イベント情報
     */
    onLoadProgress?: (event: LoaderProgressEvent) => void;

    /**
     * カスタムURLパラメータ
     * APIリクエストに追加のパラメータを付与
     */
    additionalParams?: Record<string, string>;
  }

  /**
   * 読み込まれるライブラリ型の安全な定義
   * 名称変更を防ぎ、型安全性を強化
   */
  export type Libraries = Array<
    'core' | 'maps' | 'places' | 'geometry' | 'drawing' | 'marker' | 'visualization'
  >;

  export interface LoaderStatus {
    /** ローダーステータス */
    status: 'LOADED' | 'LOADING' | 'ERROR' | 'IDLE';

    /** エラー情報（存在する場合） */
    error?: LoaderError;
  }

  /**
   * APIロードの詳細なステータス情報
   * ロガーガイドラインに準拠したコンテキスト構造を採用
   */
  export interface DetailedLoadingStatus extends LoaderStatus {
    /** ロード開始時刻 */
    startTime?: number;

    /** ロード完了時刻 */
    completeTime?: number;

    /** ロードにかかった時間(ms) - logger.measureTimeAsyncと連携可能 */
    durationMs?: number;

    /** ロードされたライブラリ */
    loadedLibraries?: string[];

    /** 再試行回数 */
    retryCount?: number;

    /** 詳細なエラー情報（エラー発生時） */
    errorDetails?: {
      /** エラーの種類 */
      category?: 'NETWORK' | 'API_KEY' | 'PARSING' | 'UNKNOWN';

      /** 元のエラーオブジェクト */
      originalError?: unknown;

      /** 最後に実行されたURL */
      lastRequestUrl?: string;

      /** レスポンスコード（存在する場合） */
      responseCode?: number;
    };

    // 標準ロガーコンテキスト項目（ロガーガイドラインに準拠）
    /** コンポーネント名 - 例: 'GoogleMapsLoader' */
    component?: string;

    /** 実行中のアクション - 例: 'load_library', 'init_map' */
    action?: string;

    /** 関連するエンティティID - 例: ライブラリ名やマップID */
    entityId?: string;

    /** 処理結果のステータス */
    status?: 'success' | 'failure' | 'partial';
  }

  /**
   * ロードプロセスの進行状況を追跡するイベント
   */
  export interface LoaderProgressEvent {
    /** 現在のステータス */
    status: 'INITIALIZED' | 'LOADING' | 'LOADED' | 'ERROR';

    /** 経過時間(ms) */
    elapsedMs: number;

    /** 関連するエラー（存在する場合） */
    error?: LoaderError;
  }

  /**
   * 環境変数と連携したAPIキー検証オプション
   * env.d.tsおよびutils/env.tsのvalidateEnvironment()関数と連携
   */
  export interface ApiKeyValidationOptions {
    /** APIキーの検証を実行するか */
    validateApiKey?: boolean;

    /** 短すぎるAPIキーを警告するか */
    warnOnShortApiKey?: boolean;

    /** 警告閾値 */
    minKeyLength?: number;

    /** 検証スキップ（開発モード専用） */
    skipValidationInDev?: boolean;
  }

  export class Loader {
    /**
     * ローディングステータスを取得（内部用）
     * @private
     */
    private status: LoaderStatus;

    /**
     * ローダーのコンストラクタ
     * @param options ローダーオプション
     */
    constructor(options: LoaderOptions);

    /**
     * 指定したライブラリを読み込む
     * @param libraryName ライブラリ名（'maps'など）
     * @returns 読み込まれたライブラリのPromise
     *
     * @throws {LoaderError} ライブラリのロードに失敗した場合
     *
     * @example
     * import { Loader } from '@googlemaps/js-api-loader';
     * const loader = new Loader({ apiKey: 'YOUR_API_KEY' });
     * const { Map } = await loader.importLibrary('maps');
     */
    importLibrary<T = unknown>(libraryName: string): Promise<T>;

    /**
     * Google Maps APIをロードする
     * @returns ロード完了を示すPromise
     *
     * @throws {LoaderError} ロードに失敗した場合
     *
     * @example
     * import { Loader } from '@googlemaps/js-api-loader';
     * const loader = new Loader({ apiKey: 'YOUR_API_KEY' });
     * await loader.load();
     * // APIが読み込まれた後の処理
     * const map = new google.maps.Map(...);
     */
    load(): Promise<typeof google>;

    /**
     * 既にAPIがロードされているか確認
     * @returns ロード済みの場合はtrue
     */
    isLoaded(): boolean;

    /**
     * ローダーの詳細なステータスを取得
     * ロガーガイドラインに準拠したログ記録に有用
     * @returns 詳細なロードステータス情報
     */
    getDetailedStatus(): DetailedLoadingStatus;

    /**
     * カスタムステータスコールバックを設定
     * @param callback ステータス変更時に呼び出されるコールバック
     * @returns このローダーインスタンス（メソッドチェーン用）
     */
    setStatusCallback(callback: (status: DetailedLoadingStatus) => void): this;
  }
}
