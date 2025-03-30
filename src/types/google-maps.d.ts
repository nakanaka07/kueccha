/**
 * Google Maps API用の拡張型定義
 * @types/google.maps に含まれていない最新機能の型定義
 */

// google.maps.marker 名前空間に関する型定義の拡張
declare namespace google.maps {
  /**
   * API バージョン情報
   */
  const version: string;

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
     */
    apiKey: string;

    /**
     * その他のオプション
     */
    [key: string]: unknown;
  }

  /**
   * Google Maps JavaScript APIをロードするためのローダークラス
   */
  export class Loader {
    constructor(options: LoaderOptions);

    /**
     * 指定したライブラリを読み込む
     * @param libraryName ライブラリ名（'maps'など）
     * @returns 読み込まれたライブラリのPromise
     */
    importLibrary(libraryName: string): Promise<unknown>;

    /**
     * Google Maps APIをロードする
     * @returns ロード完了を示すPromise
     */
    load(): Promise<typeof google>;
  }
}
