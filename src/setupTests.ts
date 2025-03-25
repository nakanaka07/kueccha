// テスト環境のセットアップ
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import 'whatwg-fetch'; // fetch APIのポリフィル
import { vi, beforeAll, afterEach } from 'vitest'; // Vitestのインポートを追加

// テスト環境でのconsole.errorとwarningの処理
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// コンソールエラーをより明確にキャプチャして表示
console.error = (...args) => {
  originalConsoleError(...args);
  // テスト失敗を明確にするため、特定のエラーでは例外をスローすることもできます
  // if (args[0].includes('特定のエラーメッセージ')) {
  //   throw new Error(args[0]);
  // }
};

console.warn = (...args) => {
  originalConsoleWarn(...args);
};

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

// Mapクラスの必要なメソッドをモック
class MockMap {
  static DEMO_MAP_ID = 'DEMO_MAP_ID';

  controls = [];
  data = {};

  constructor(_mapDiv: HTMLElement, _opts?: any) {}

  setCenter() {}
  setZoom() {}
  fitBounds() {}
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

// Markerクラスの必要なメソッドをモック
class MockMarker {
  static MAX_ZINDEX = 999;

  constructor(_opts?: any) {}

  setMap() {}
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

// PlacesServiceクラスのモック
class MockPlacesService {
  constructor(_attrContainer: any) {}

  getDetails(_request: any, callback: (result: any, status: PlacesServiceStatus) => void) {
    callback({ geometry: new MockGeometry() }, 'OK' as any);
  }

  findPlaceFromPhoneNumber() {}
  findPlaceFromQuery() {}
  nearbySearch() {}
  textSearch() {}
}

// eventの型定義（コンストラクタ関数としても機能する必要があります）
const eventMock = {
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

// Google Maps APIのグローバルモックを作成し型アサーションで型エラーを回避
global.google = {
  maps: {
    Map: MockMap as any,
    Marker: MockMarker as any,
    LatLng: MockLatLng as any,
    places: {
      PlacesService: MockPlacesService as any,
    },
    event: eventMock as any,
    // 以下を追加：コントロールポジションの定数
    ControlPosition: {
      RIGHT_BOTTOM: 7,
      RIGHT_CENTER: 3,
      RIGHT_TOP: 6,
      TOP_RIGHT: 2,
      LEFT_TOP: 5,
    },
    // マップタイプコントロールスタイルの定数
    MapTypeControlStyle: {
      DROPDOWN_MENU: 2,
    },
    // マップタイプIDの定数
    MapTypeId: {
      ROADMAP: 'roadmap',
      SATELLITE: 'satellite',
      HYBRID: 'hybrid',
      TERRAIN: 'terrain',
    },
  },
} as any;

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
