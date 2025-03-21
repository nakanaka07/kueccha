import { isBrowser } from '../utils/env.utils';
import { createError } from '../utils/error.utils';

import type {
  MapConfig,
  MarkerOptions,
  Marker,
  LatLngLiteral,
  Bounds,
  MarkerAnimation,
} from '../types';
import type { MapAdapter } from './index';

/**
 * Google Maps APIが利用可能かどうかを確認する
 */
function isGoogleMapsAvailable(): boolean {
  return isBrowser() && typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}

/**
 * Google Maps APIのマーカーをラップするクラス
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
 * Google Maps APIをアプリケーションの地図インターフェースに適合させるアダプタークラス
 */
export class GoogleMapsAdapter implements MapAdapter {
  private map: google.maps.Map | null = null;
  private markers: Map<string, GoogleMapMarker> = new Map();
  private eventListeners: Map<string, google.maps.MapsEventListener[]> = new Map();
  private isInitialized = false;

  /**
   * Google Maps APIを初期化し、指定した要素に地図を表示する
   */
  async initialize(config: MapConfig): Promise<boolean> {
    try {
      if (!isBrowser()) {
        console.warn('Attempted to initialize Google Maps in a non-browser environment');
        return false;
      }

      if (!isGoogleMapsAvailable()) {
        throw createError('MAP', 'API_NOT_LOADED', 'Google Maps APIが読み込まれていません', {
          config,
        });
      }

      const container = document.getElementById(config.containerId);
      if (!container) {
        throw createError(
          'MAP',
          'CONTAINER_NOT_FOUND',
          `マップコンテナ要素が見つかりません: ${config.containerId}`,
          { config },
        );
      }

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
   * 地図が初期化されていることを確認する内部メソッド
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
   * マーカーを作成して地図に追加する
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

    if (options.id) {
      this.markers.set(options.id, marker);
    }

    return marker;
  }

  /**
   * 地図の中心を設定する
   */
  setCenter(position: LatLngLiteral): void {
    this.ensureInitialized();
    this.map!.setCenter(position);
  }

  /**
   * 地図のズームレベルを設定する
   */
  setZoom(zoomLevel: number): void {
    this.ensureInitialized();
    this.map!.setZoom(zoomLevel);
  }

  /**
   * 指定した境界に合わせて地図を表示する
   */
  fitBounds(bounds: Bounds): void {
    this.ensureInitialized();
    const googleBounds = new google.maps.LatLngBounds(bounds.southwest, bounds.northeast);
    this.map!.fitBounds(googleBounds);
  }

  /**
   * IDによってマーカーを取得する
   */
  getMarkerById(id: string): Marker | null {
    return this.markers.get(id) || null;
  }

  /**
   * 地図のイベントにリスナーを追加する
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
   * 地図のイベントからリスナーを削除する
   */
  removeEventListener(eventName: string, handler?: Function): void {
    if (!this.eventListeners.has(eventName)) {
      return;
    }

    const listeners = this.eventListeners.get(eventName)!;

    if (!handler) {
      listeners.forEach((listener) => {
        google.maps.event.removeListener(listener);
      });
      this.eventListeners.delete(eventName);
    } else {
      console.warn('Individual handler removal is not supported by Google Maps API.');
    }
  }

  /**
   * すべてのイベントリスナーを削除する
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
   * ネイティブのGoogle Mapsオブジェクトを取得する
   */
  getNativeMap(): google.maps.Map | null {
    return this.map;
  }

  /**
   * 地図と関連リソースを破棄する
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
 * Google Maps APIを使用する地図アダプタを作成する
 */
export function createGoogleMapsAdapter(): MapAdapter {
  return new GoogleMapsAdapter();
}
