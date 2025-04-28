// テスト環境のセットアップ
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import 'whatwg-fetch'; // fetch APIのポリフィル
import { vi, beforeAll, afterEach, afterAll } from 'vitest';

// プロジェクト固有のインポート（パスエイリアスを活用）
import { logger } from '@/utils/logger';

// テスト環境でのconsole.errorとwarningの処理
// ESLintの警告が出ないよう変数定義を修正

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// コンソール出力をカスタマイズ（テスト環境ではコンソール出力は一般的なため警告を抑制）
console.error = (...args: Parameters<typeof console.error>) => {
  originalConsoleError(...args);
  // テスト失敗を明確にするため、特定のエラーでは例外をスローすることもできます
  // if (args[0] && typeof args[0] === 'string' && args[0].includes('特定のエラーメッセージ')) {
  //   throw new Error(args[0]);
  // }
};

console.warn = (...args: Parameters<typeof console.warn>) => {
  originalConsoleWarn(...args);
};

// Testing Libraryの設定
configure({
  // テストタイムアウトの設定（ミリ秒）
  asyncUtilTimeout: 5000,
});

// Google Maps APIのモック用の型定義
// 名前空間の代わりにESモジュール構文を使用
// PlacesServiceのステータス型
export type PlacesServiceStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

export interface MapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
  mapTypeId?: string;
  [key: string]: unknown;
}

export interface MarkerOptions {
  position?: { lat: number; lng: number };
  map?: MockMap | null;
  title?: string;
  icon?: unknown;
  [key: string]: unknown;
}

export interface PlacesServiceRequest {
  placeId?: string;
  [key: string]: unknown;
}

export interface PlacesServiceResult {
  geometry: MockGeometry;
  [key: string]: unknown;
}

// イベント関連の型を整理
export interface EventMock {
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  prototype: Record<string, unknown>;
  addDomListener: ReturnType<typeof vi.fn>;
  addDomListenerOnce: ReturnType<typeof vi.fn>;
  addListenerOnce: ReturnType<typeof vi.fn>;
  clearInstanceListeners: ReturnType<typeof vi.fn>;
  clearListeners: ReturnType<typeof vi.fn>;
  hasListeners: ReturnType<typeof vi.fn>;
  trigger: ReturnType<typeof vi.fn>;
}

// GoogleMapsのモックの型定義
export interface GoogleMapsNamespaceMock extends Record<string, unknown> {
  Map: typeof MockMap;
  Marker: typeof MockMarker;
  LatLng: typeof MockLatLng;
  places: {
    PlacesService: typeof MockPlacesService;
  };
  event: EventMock;
  ControlPosition: {
    RIGHT_BOTTOM: number;
    RIGHT_CENTER: number;
    RIGHT_TOP: number;
    TOP_RIGHT: number;
    LEFT_TOP: number;
  };
  MapTypeControlStyle: {
    DROPDOWN_MENU: number;
  };
  MapTypeId: {
    ROADMAP: string;
    SATELLITE: string;
    HYBRID: string;
    TERRAIN: string;
  };
  importLibrary: () => Promise<unknown>;
}

// グローバルのgoogleオブジェクト型
export interface GlobalWithGoogle {
  google: {
    maps: GoogleMapsNamespaceMock;
  };
}

// Google Maps APIのモック実装
// 位置情報のモッククラス
class MockGeometry {
  // 東京駅の座標をデフォルト値として使用
  location = {
    lat: () => 35.6812,
    lng: () => 139.7671,
  };
}

// 地理座標のモッククラス
class MockLatLng {
  private lat_value: number;
  private lng_value: number;

  constructor(lat: number, lng: number) {
    this.lat_value = lat;
    this.lng_value = lng;
  }

  lat() {
    return this.lat_value;
  }
  lng() {
    return this.lng_value;
  }

  equals(_other: MockLatLng) {
    return true;
  }
  toJSON() {
    return { lat: this.lat_value, lng: this.lng_value };
  }
  toUrlValue(_precision?: number) {
    return `${this.lat_value},${this.lng_value}`;
  }
}

// 地図オブジェクトのモック
class MockMap {
  static DEMO_MAP_ID = 'DEMO_MAP_ID';

  controls: unknown[] = [];
  data = {};

  constructor(_mapDiv: HTMLElement, _opts?: MapOptions) {
    logger.debug('MockMap constructed', { element: _mapDiv.id, options: _opts });
  }

  setCenter(): void {}
  setZoom(): void {}
  fitBounds(): void {}
  getBounds() {
    return {};
  }
  getCenter() {
    return new MockLatLng(0, 0);
  }
  getDiv() {
    return document.createElement('div');
  }
  getMapTypeId() {
    return '';
  }
  getZoom() {
    return 10;
  }
}

// マーカーのモッククラス
class MockMarker {
  static MAX_ZINDEX = 999;
  private options: MarkerOptions;

  constructor(options?: MarkerOptions) {
    this.options = options ?? {};
    logger.debug('MockMarker constructed', { options });
  }

  setMap(_map: MockMap | null): void {
    this.options.map = _map;
  }

  getAnimation() {
    return null;
  }
  getClickable() {
    return true;
  }
  getCursor() {
    return '';
  }
  getDraggable() {
    return false;
  }
  getIcon() {
    return this.options.icon ?? null;
  }
  getLabel() {
    return null;
  }
  getPosition() {
    return this.options.position
      ? new MockLatLng(this.options.position.lat, this.options.position.lng)
      : new MockLatLng(0, 0);
  }
  getShape() {
    return null;
  }
  getTitle() {
    return this.options.title ?? '';
  }
  getVisible() {
    return true;
  }
  getZIndex() {
    return 0;
  }
}

// PlacesServiceクラスのモック
class MockPlacesService {
  constructor(_attrContainer: unknown) {
    logger.debug('MockPlacesService constructed');
  }

  getDetails(
    request: PlacesServiceRequest,
    callback: (result: PlacesServiceResult, status: PlacesServiceStatus) => void
  ): void {
    logger.debug('PlacesService.getDetails called', { request });
    callback({ geometry: new MockGeometry() }, 'OK');
  }

  findPlaceFromPhoneNumber(): void {}
  findPlaceFromQuery(): void {}
  nearbySearch(): void {}
  textSearch(): void {}
}

// イベント関連のモック
const eventMock: EventMock = {
  addListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  removeListener: vi.fn(),
  prototype: {},
  addDomListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  addDomListenerOnce: vi.fn().mockReturnValue({ remove: vi.fn() }),
  addListenerOnce: vi.fn().mockReturnValue({ remove: vi.fn() }),
  clearInstanceListeners: vi.fn(),
  clearListeners: vi.fn(),
  hasListeners: vi.fn().mockReturnValue(false),
  trigger: vi.fn(),
};

// GoogleMaps APIモックの集約
// 型名と実装の重複を排除し、名前空間を一貫して使用
const googleMapsMock: GoogleMapsNamespaceMock = {
  Map: MockMap,
  Marker: MockMarker,
  LatLng: MockLatLng,
  places: {
    PlacesService: MockPlacesService,
  },
  event: eventMock,
  ControlPosition: {
    RIGHT_BOTTOM: 7,
    RIGHT_CENTER: 3,
    RIGHT_TOP: 6,
    TOP_RIGHT: 2,
    LEFT_TOP: 5,
  },
  MapTypeControlStyle: {
    DROPDOWN_MENU: 2,
  },
  MapTypeId: {
    ROADMAP: 'roadmap',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TERRAIN: 'terrain',
  },
  // 非同期APIライブラリインポートのモック
  importLibrary: vi.fn().mockImplementation(library => {
    logger.debug('Google Maps library import requested', { library });
    return Promise.resolve({});
  }),

  // その他の必要なプロパティをスッキリ設定
  CollisionBehavior: {},
  ColorScheme: {},
  Containment: {},
  Data: {},
};

// グローバル変数としてgoogleを登録
const globalWithGoogle = global as unknown as GlobalWithGoogle;
globalWithGoogle.google = {
  maps: googleMapsMock,
};

// テスト環境のセットアップ
beforeAll(() => {
  // 環境変数のモック設定（ロギングのためのコンテキスト追加）
  const mockEnv = {
    VITE_GOOGLE_API_KEY: 'test-api-key',
    VITE_SHEET_ID: 'test-sheet-id',
  };

  process.env = {
    ...process.env,
    ...mockEnv,
  };

  // ロガーの設定（テスト環境用）
  logger.info('テスト環境セットアップ完了', {
    environment: 'test',
    mockEnv: Object.keys(mockEnv),
  });
});

// テスト間でモックをリセット
afterEach(() => {
  vi.clearAllMocks();
  logger.debug('テスト間のモックリセット完了');
});

// 全テスト完了後のクリーンアップ
afterAll(() => {
  // コンソールのオリジナル関数を復元
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;

  // テスト環境のクリーンアップ完了をログに記録
  logger.info('テスト環境のクリーンアップ完了');
});
