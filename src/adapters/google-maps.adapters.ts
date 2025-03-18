/**
 * Google Maps APIのアダプター実装
 *
 * Google Maps APIとの連携を抽象化し、アプリケーションコードから
 * 直接的な依存を分離します。これにより、テスト容易性と将来的な
 * API変更への対応を改善します。
 */

import {
  MapConfig,
  MarkerOptions,
  Marker,
  LatLngLiteral,
  Bounds,
  MapEventHandlers,
  MapLoadError,
  MarkerAnimation,
} from '../types';
import { isBrowser } from '../utils/env.utils';
import { createError } from '../utils/error.utils';

import { MapAdapter } from './index';

/**
 * Google Maps APIが利用可能かどうかを確認
 */
function isGoogleMapsAvailable(): boolean {
  return isBrowser() && typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}

/**
 * Google Maps ラッパーのマーカークラス
 */
class GoogleMapMarker implements Marker {
  constructor(private googleMarker: google.maps.Marker) {}

  setVisible(visible: boolean): void {
    this.googleMarker.setVisible(visible);
  }

  setPosition(position: LatLngLiteral): void {
    this.googleMarker.setPosition(position);
  }

  setAnimation(animation: MarkerAnimation): void {
    this.googleMarker.setAnimation(animation as google.maps.Animation);
  }

  addListener(event: string, handler: Function): google.maps.MapsEventListener {
    return this.googleMarker.addListener(event, handler as any);
  }

  remove(): void {
    this.googleMarker.setMap(null);
  }
}

/**
 * Google MapsのAPIをアダプターパターンで抽象化するクラス
 */
export class GoogleMapsAdapter implements MapAdapter {
  private map: google.maps.Map | null = null;
  private markers: Map<string, GoogleMapMarker> = new Map();
  private eventListeners: Map<string, google.maps.MapsEventListener[]> = new Map();
  private isInitialized: boolean = false;

  /**
   * Google Mapsを初期化する
   * @param config マップ設定
   * @returns 初期化成功したかどうか
   */
  async initialize(config: MapConfig): Promise<boolean> {
    try {
      // ブラウザ環境でない場合は初期化しない
      if (!isBrowser()) {
        console.warn('Attempted to initialize Google Maps in a non-browser environment');
        return false;
      }

      // Google Maps APIが読み込まれているか確認
      if (!isGoogleMapsAvailable()) {
        throw createError('MAP', 'API_NOT_LOADED', 'Google Maps APIが読み込まれていません', { config });
      }

      // DOM要素の存在確認
      const container = document.getElementById(config.containerId);
      if (!container) {
        throw createError('MAP', 'CONTAINER_NOT_FOUND', `マップコンテナ要素が見つかりません: ${config.containerId}`, {
          config,
        });
      }

      // マップオプションの構築
      const mapOptions: google.maps.MapOptions = {
        center: config.center,
        zoom: config.zoom,
        minZoom: config.minZoom,
        maxZoom: config.maxZoom,
        streetViewControl: config.streetViewControl ?? false,
        mapTypeControl: config.mapTypeControl ?? false,
        fullscreenControl: config.fullscreenControl ?? false,
        zoomControl: config.zoomControl ?? true,
        styles: config.styles,
        mapId: config.mapId,
        gestureHandling: config.gestureHandling ?? 'auto',
        mapTypeId: (config.mapTypeId as google.maps.MapTypeId) || google.maps.MapTypeId.ROADMAP,
      };

      // マップの作成
      this.map = new google.maps.Map(container, mapOptions);
      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * マップが初期化されているか確認する
   * @throws マップが初期化されていない場合にエラーをスロー
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.map) {
      throw createError(
        'MAP',
        'NOT_INITIALIZED',
        'Google Mapsが初期化されていません。initialize()を先に呼び出してください。',
      );
    }
  }

  /**
   * マーカーを作成する
   * @param options マーカーオプション
   * @returns 作成されたマーカー
   */
  createMarker(options: MarkerOptions): Marker {
    this.ensureInitialized();

    const markerOptions: google.maps.MarkerOptions = {
      position: options.position,
      map: this.map,
      title: options.title,
      icon: options.icon,
      opacity: options.opacity ?? 1.0,
      visible: options.visible ?? true,
      zIndex: options.zIndex,
      animation: options.animation as google.maps.Animation,
      draggable: options.draggable ?? false,
    };

    const googleMarker = new google.maps.Marker(markerOptions);
    const marker = new GoogleMapMarker(googleMarker);

    // IDが指定されている場合はマーカーを保存
    if (options.id) {
      this.markers.set(options.id, marker);
    }

    return marker;
  }

  /**
   * マップの中心位置を設定する
   * @param position 中心位置
   */
  setCenter(position: LatLngLiteral): void {
    this.ensureInitialized();
    this.map!.setCenter(position);
  }

  /**
   * マップのズームレベルを設定する
   * @param zoomLevel ズームレベル
   */
  setZoom(zoomLevel: number): void {
    this.ensureInitialized();
    this.map!.setZoom(zoomLevel);
  }

  /**
   * 指定した領域が画面に収まるようにマップを調整
   * @param bounds 表示領域
   */
  fitBounds(bounds: Bounds): void {
    this.ensureInitialized();

    const googleBounds = new google.maps.LatLngBounds(bounds.southwest, bounds.northeast);

    this.map!.fitBounds(googleBounds);
  }

  /**
   * 指定したIDを持つマーカーを取得する
   * @param id マーカーID
   * @returns マーカーまたはnull
   */
  getMarkerById(id: string): Marker | null {
    return this.markers.get(id) || null;
  }

  /**
   * マップイベントリスナーを追加する
   * @param eventName イベント名
   * @param handler イベントハンドラ
   */
  addEventListener(eventName: string, handler: Function): void {
    this.ensureInitialized();

    const listener = this.map!.addListener(eventName, handler as any);

    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }

    this.eventListeners.get(eventName)!.push(listener);
  }

  /**
   * マップイベントリスナーを削除する
   * @param eventName イベント名
   * @param handler イベントハンドラ（指定しない場合は全てのハンドラを削除）
   */
  removeEventListener(eventName: string, handler?: Function): void {
    if (!this.eventListeners.has(eventName)) {
      return;
    }

    const listeners = this.eventListeners.get(eventName)!;

    if (!handler) {
      // 特定のイベントの全リスナーを削除
      listeners.forEach((listener) => {
        google.maps.event.removeListener(listener);
      });
      this.eventListeners.delete(eventName);
    } else {
      // 個別のリスナーは直接removeできないため、全て削除して再登録する方式はあまり効率的ではない
      // Googleマップの仕様上の制約となる
      console.warn('Individual handler removal is not supported by Google Maps API.');
    }
  }

  /**
   * 全てのリスナーを削除
   */
  clearAllListeners(): void {
    this.eventListeners.forEach((listeners) => {
      listeners.forEach((listener) => {
        google.maps.event.removeListener(listener);
      });
    });

    this.eventListeners.clear();
  }

  /**
   * マップインスタンスを取得（テスト/デバッグ用）
   * アダプターパターンの原則からは外れるが、特殊ケース用に用意
   */
  getNativeMap(): google.maps.Map | null {
    return this.map;
  }

  /**
   * アダプターの破棄（クリーンアップ処理）
   */
  dispose(): void {
    this.clearAllListeners();
    this.markers.forEach((marker) => marker.remove());
    this.markers.clear();
    this.map = null;
    this.isInitialized = false;
  }
}

/**
 * Google Maps APIファクトリ関数
 * 依存性注入のためのファクトリパターン
 */
export function createGoogleMapsAdapter(): MapAdapter {
  return new GoogleMapsAdapter();
}
