// テスト環境のセットアップ
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import 'whatwg-fetch'; // fetch APIのポリフィル
import { vi, beforeAll, afterEach } from 'vitest'; // Vitestのインポートを追加

// テスト環境でのconsole.errorとwarningの処理
// ESLintの警告が出ないよう変数定義を修正
/* eslint-disable no-console */
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
/* eslint-enable no-console */

// Testing Libraryの設定
configure({
  // テストタイムアウトの設定（ミリ秒）
  asyncUtilTimeout: 5000,
});

// Google Maps APIのモック用の型定義
type PlacesServiceStatus =
  | 'OK'
  | 'ZERO_RESULTS'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

// Google Maps APIのモック
class MockGeometry {
  location = {
    lat: () => 35.6812,
    lng: () => 139.7671,
  }; // 東京駅の座標
}

// 正しい型定義を持つMockLatLngクラス
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

interface MapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
  mapTypeId?: string;
  [key: string]: unknown;
}

// Mapクラスの必要なメソッドをモック
class MockMap {
  static DEMO_MAP_ID = 'DEMO_MAP_ID';

  controls: unknown[] = [];
  data = {};

  constructor(_mapDiv: HTMLElement, _opts?: MapOptions) {}

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

interface MarkerOptions {
  position?: { lat: number; lng: number };
  map?: MockMap | null;
  title?: string;
  [key: string]: unknown;
}

// Markerクラスの必要なメソッドをモック
class MockMarker {
  static MAX_ZINDEX = 999;

  constructor(_opts?: MarkerOptions) {}

  setMap(): void {}
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
    return null;
  }
  getLabel() {
    return null;
  }
  getPosition() {
    return new MockLatLng(0, 0);
  }
  getShape() {
    return null;
  }
  getTitle() {
    return '';
  }
  getVisible() {
    return true;
  }
  getZIndex() {
    return 0;
  }
}

interface PlacesServiceRequest {
  placeId?: string;
  [key: string]: unknown;
}

interface PlacesServiceResult {
  geometry: MockGeometry;
  [key: string]: unknown;
}

// PlacesServiceクラスのモック
class MockPlacesService {
  constructor(_attrContainer: unknown) {}

  getDetails(
    _request: PlacesServiceRequest,
    callback: (result: PlacesServiceResult, status: PlacesServiceStatus) => void
  ): void {
    callback({ geometry: new MockGeometry() }, 'OK');
  }

  findPlaceFromPhoneNumber(): void {}
  findPlaceFromQuery(): void {}
  nearbySearch(): void {}
  textSearch(): void {}
}

// eventの型定義
interface EventMock {
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

// eventMockオブジェクトの作成
const eventMock: EventMock = {
  addListener: vi.fn(),
  removeListener: vi.fn(),
  prototype: {},
  addDomListener: vi.fn(),
  addDomListenerOnce: vi.fn(),
  addListenerOnce: vi.fn(),
  clearInstanceListeners: vi.fn(),
  clearListeners: vi.fn(),
  hasListeners: vi.fn(),
  trigger: vi.fn(),
};

// テスト環境用のモックオブジェクト型定義
// 実際のGoogle Maps APIの型定義と完全に一致させる必要はない
type GoogleMapsNamespaceMock = Record<string, unknown> & {
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
};

// 型安全なグローバルGoogle APIモックの作成
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
  importLibrary: () => Promise.resolve({}),

  // 他のGoogle Mapsで必要なプロパティに対応するためのダミー値
  CollisionBehavior: {},
  ColorScheme: {},
  Containment: {},
  Data: {},

  // 他にエラーで言及されているプロパティがあれば追加
};

// google をグローバル変数として宣言 (ファイル内スコープ)
interface GlobalWithGoogle {
  google: {
    maps: GoogleMapsNamespaceMock;
  };
}

// 既存のglobalオブジェクトを拡張
const globalWithGoogle = global as unknown as GlobalWithGoogle;
globalWithGoogle.google = {
  maps: googleMapsMock,
};

// 環境変数のモック設定
beforeAll(() => {
  process.env = {
    ...process.env,
    VITE_GOOGLE_MAPS_API_KEY: 'test-api-key',
    VITE_SHEET_ID: 'test-sheet-id',
  };
});

// テスト間でモックをリセット
afterEach(() => {
  vi.clearAllMocks();
});
