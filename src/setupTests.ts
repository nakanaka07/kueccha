// テスト環境のセットアップ
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import 'whatwg-fetch'; // fetch APIのポリフィル

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

// Google Maps APIのモック
class MockGeometry {
  location = { lat: () => 35.6812, lng: () => 139.7671 }; // 東京駅の座標
}

class MockLatLng {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }
  lat() { return this.lat; }
  lng() { return this.lng; }
}

// Google Maps APIのグローバルモック
global.google = {
  maps: {
    Map: class { 
      setCenter() {} 
      setZoom() {}
    },
    Marker: class { 
      setMap() {} 
    },
    LatLng: MockLatLng,
    places: {
      PlacesService: class {
        getDetails(_, callback) {
          callback({ geometry: new MockGeometry() }, 'OK');
        }
      }
    },
    event: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
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
  jest.clearAllMocks();
});