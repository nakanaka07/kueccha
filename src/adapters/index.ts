/**
 * アダプター層
 *
 * 外部サービスとの連携を抽象化するインターフェースと実装を提供します。
 * このレイヤーは外部APIやプラットフォーム固有の実装を分離し、
 * テスト容易性と保守性を向上させます。
 */

// ============================================================================
// インターフェース定義
// ============================================================================

/**
 * マップサービスのインターフェース
 * 地図表示や操作のためのAPI抽象化
 */
export interface MapAdapter {
  /**
   * マップを初期化する
   * @param config マップ設定オブジェクト
   */
  initialize(config: MapConfig): Promise<boolean>;

  /**
   * マーカーを作成する
   * @param options マーカーオプション
   */
  createMarker(options: MarkerOptions): Marker;

  /**
   * マップの中心位置を設定する
   * @param position 新しい中心位置
   */
  setCenter(position: LatLngLiteral): void;

  /**
   * マップのズームレベルを設定する
   * @param zoomLevel ズームレベル
   */
  setZoom(zoomLevel: number): void;

  /**
   * マップ上の領域を表示する
   * @param bounds 表示する領域
   */
  fitBounds(bounds: Bounds): void;

  /**
   * マップのイベントリスナーを登録する
   * @param eventName イベント名
   * @param handler イベントハンドラ
   */
  addEventListener(eventName: string, handler: Function): void;

  /**
   * マップのイベントリスナーを削除する
   * @param eventName イベント名
   * @param handler イベントハンドラ
   */
  removeEventListener(eventName: string, handler: Function): void;
}

/**
 * ストレージサービスのインターフェース
 * ブラウザストレージ操作の抽象化
 */
export interface StorageAdapter {
  /**
   * アイテムを保存する
   * @param key キー
   * @param value 値
   */
  setItem<T>(key: string, value: T): boolean;

  /**
   * アイテムを取得する
   * @param key キー
   * @param defaultValue デフォルト値
   */
  getItem<T>(key: string, defaultValue: T): T;

  /**
   * アイテムを削除する
   * @param key キー
   */
  removeItem(key: string): boolean;

  /**
   * ストレージをクリアする
   */
  clear(): boolean;
}

/**
 * Googleスプレッドシートアダプターのインターフェース
 * スプレッドシートデータ取得の抽象化
 */
export interface SheetsAdapter {
  /**
   * スプレッドシートからデータを取得する
   * @param sheetName シート名
   * @param range 取得範囲
   */
  fetchData<T>(sheetName: string, range?: string): Promise<T[]>;

  /**
   * スプレッドシートにデータを書き込む
   * @param sheetName シート名
   * @param range 書き込み範囲
   * @param values 書き込む値
   */
  writeData<T>(sheetName: string, range: string, values: T[]): Promise<boolean>;
}

/**
 * 位置情報サービスのインターフェース
 * ブラウザ位置情報APIの抽象化
 */
export interface GeolocationAdapter {
  /**
   * 現在位置を取得する
   * @param options 位置情報取得オプション
   */
  getCurrentPosition(options?: GeolocationOptions): Promise<LatLngLiteral>;

  /**
   * 位置情報の変更を監視する
   * @param callback 位置変更時のコールバック
   * @param options 位置情報取得オプション
   */
  watchPosition(callback: (position: LatLngLiteral) => void, options?: GeolocationOptions): number;

  /**
   * 位置監視を解除する
   * @param watchId 監視ID
   */
  clearWatch(watchId: number): void;
}

// ============================================================================
// 具体的な実装のエクスポート
// ============================================================================

// 個別のアダプター実装ファイルが作成されたらこちらからエクスポート
// export * from './map/google-maps.adapter';
// export * from './storage/browser-storage.adapter';
// export * from './sheets/google-sheets.adapter';
// export * from './geolocation/browser-geolocation.adapter';

// ============================================================================
// 型インポート
// ============================================================================

import type {
  MapConfig,
  MarkerOptions,
  Marker,
  LatLngLiteral,
  Bounds,
  GeolocationOptions,
} from '../types';
