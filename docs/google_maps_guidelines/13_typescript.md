# 13. 型安全性とリント最適化

## Google Maps APIの型定義

```typescript
// google-maps.d.ts で型定義を拡張
declare global {
  namespace google {
    namespace maps {
      namespace marker {
        // Advanced Markers APIの型定義
        class AdvancedMarkerElement extends google.maps.MVCObject {
          constructor(
            options?: google.maps.marker.AdvancedMarkerElementOptions
          );
          position: google.maps.LatLng | google.maps.LatLngLiteral | null;
          title: string | null;
          content: Node | null;
          map: google.maps.Map | null;
          zIndex: number | null;
          collisionBehavior: string | null;
          gmpClickable: boolean | null;
          gmpDraggable: boolean | null; // 2025年最新のドラッグ可能属性
          gmpVisible: boolean | null; // 2025年最新の可視性制御
        }

        interface AdvancedMarkerElementOptions {
          position?: google.maps.LatLng | google.maps.LatLngLiteral;
          title?: string;
          content?: Node;
          map?: google.maps.Map;
          zIndex?: number;
          collisionBehavior?: string;
          gmpClickable?: boolean;
          gmpDraggable?: boolean;
          gmpVisible?: boolean;
        }

        // Pin要素の型定義
        class PinElement {
          constructor(options?: PinElementOptions);
          background: string | null;
          borderColor: string | null;
          glyphColor: string | null;
          glyph: string | null;
          scale: number;
          element: HTMLElement;
        }

        interface PinElementOptions {
          background?: string;
          borderColor?: string;
          glyphColor?: string;
          glyph?: string;
          scale?: number;
          borderRadius?: string; // 2025年追加: 角の丸みを設定
        }
      }

      // マップの機能をチェックするための型定義
      interface MapCapabilities {
        isAdvancedMarkersAvailable: boolean;
        isWebGLOverlayViewAvailable: boolean;
        isLocalContextLibraryAvailable?: boolean; // 2025年追加: ローカルコンテキストライブラリの利用可否
        isVectorMapAvailable?: boolean; // 2025年追加: ベクターマップ対応
      }

      interface Map {
        getMapCapabilities(): MapCapabilities;
      }

      // 2025年追加: WebGLオーバーレイビューの拡張型定義
      namespace webgl {
        class WebGLOverlayView extends google.maps.MVCObject {
          constructor();
          onAdd?: (map: google.maps.Map) => void;
          onDraw?: (options: WebGLDrawOptions) => void;
          onRemove?: () => void;
          onContextLost?: () => void;
          onContextRestored?: (options: WebGLDrawOptions) => void;
          setMap(map: google.maps.Map | null): void;
          requestRedraw(): void;
          getMap(): google.maps.Map | null;
        }

        interface WebGLDrawOptions {
          gl: WebGLRenderingContext;
          transformer: any;
          matrix: Float32Array;
        }
      }
    }
  }
}

// カスタムタイプが明示的にエクスポートされるようにする
export {};
```

## ESLintとTSの設定最適化

```javascript
// eslint.config.js内のGoogle Maps関連ルール
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { typescriptRules } from './rules/typescript.js';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      ...typescriptRules,
      // Google Maps API使用時の特殊ルール
      'no-undef': 'off', // グローバルのgoogleオブジェクトへのアクセスで警告が出ないように
      '@typescript-eslint/no-explicit-any': [
        'error',
        {
          // google.maps名前空間の特定のオブジェクトはanyを許可
          ignoreRestArgs: true,
          allowExplicitAny: false,
        },
      ],
      // APIのバージョンチェックを強制するカスタムルール
      'custom-rules/check-maps-version': 'warn',
    },
    // Google Maps関連ファイルの特定
    files: ['**/src/hooks/useGoogleMaps.ts', '**/src/components/Map*.tsx'],
  }
);
```

## マーカーと地図オブジェクトの型安全な操作

```typescript
// 型安全なマーカー作成関数
function createTypeSafeMarker(
  poi: PointOfInterest,
  useAdvancedMarker = true
): google.maps.marker.AdvancedMarkerElement | google.maps.Marker {
  // Advanced Marker APIの存在確認
  if (
    useAdvancedMarker &&
    typeof google.maps.marker !== 'undefined' &&
    'AdvancedMarkerElement' in google.maps.marker &&
    typeof google.maps.marker.AdvancedMarkerElement === 'function'
  ) {
    // 型安全なオプション構築
    const options: google.maps.marker.AdvancedMarkerElementOptions = {
      position: { lat: poi.lat, lng: poi.lng },
      title: poi.name,
    };

    // マーカーコンテンツの条件分岐も型安全に
    if ('PinElement' in google.maps.marker) {
      const pinOptions: google.maps.marker.PinElementOptions = {
        background: getCategoryColor(poi.category),
        scale: poi.isHighlighted ? 1.2 : 1,
      };

      // POIのプロパティに応じて追加の設定
      if (poi.isClosed) {
        pinOptions.glyph = '×';
        pinOptions.glyphColor = '#ff0000';
      }

      options.content = new google.maps.marker.PinElement(pinOptions).element;
    } else {
      // PinElementがない場合のフォールバック
      const div = document.createElement('div');
      div.className = 'map-marker';
      div.textContent = poi.name.substring(0, 1);
      options.content = div;
    }

    return new google.maps.marker.AdvancedMarkerElement(options);
  } else {
    // 従来のマーカーへのフォールバック（型を明示）
    const options: google.maps.MarkerOptions = {
      position: { lat: poi.lat, lng: poi.lng },
      title: poi.name,
      icon: {
        url: getMarkerIcon(poi.category),
        scaledSize: new google.maps.Size(32, 32),
      },
      map: null, // 初期状態ではマップに表示しない
    };

    return new google.maps.Marker(options);
  }
}
```

## 型安全性向上のためのユーティリティ関数

```typescript
// APIバージョンチェックユーティリティ
function isApiVersionSupported(requiredVersion: string): boolean {
  // Google Mapsオブジェクトが存在するか確認
  if (typeof google === 'undefined' || !google.maps) {
    return false;
  }

  // バージョン文字列の取得（APIから取得できる場合）
  let apiVersion = '';
  try {
    // 注: バージョン情報がAPIから直接取得できない場合もある
    // この例では実装方法を示すためのものです
    apiVersion = (google.maps as any).version || '';
  } catch (error) {
    console.warn('Maps APIバージョンの取得に失敗しました', error);
    return false;
  }

  // バージョン比較ロジック
  return compareVersions(apiVersion, requiredVersion) >= 0;
}

// マーカータイプチェック
// 異なるマーカータイプを安全に扱うためのタイプガード
function isAdvancedMarker(
  marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
): marker is google.maps.marker.AdvancedMarkerElement {
  return 'content' in marker && marker.content !== undefined;
}

// イベントリスナーの型安全な追加
function addSafeClickListener<T extends google.maps.MVCObject>(
  target: T,
  callback: (event: google.maps.MapMouseEvent) => void
): google.maps.MapsEventListener {
  return target.addListener('click', callback);
}
```

## リント最適化とコード品質チェック

以下のTypeScriptコンパイラオプションがGoogle Maps Platformとの互換性の確保と型安全性の向上に役立ちます：

```json
// tsconfig.json の推奨設定
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "allowUnreachableCode": false,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Google Maps API固有のESLintルール

```typescript
// ./rules/typescript.js でのGoogle Maps固有のカスタムルール
export const typescriptRules = {
  // Google Maps APIの推奨使用方法を強制
  'custom-rules/maps-api-usage': [
    'warn',
    {
      // 非推奨APIの使用を警告
      deprecatedApis: [
        'google.maps.visualization', // GeoJSON APIを使用すべき
        'google.maps.MapTypeControlStyle.DEFAULT', // 明示的なスタイルを使用すべき
      ],
      // 必須のエラーハンドリング
      requireErrorHandling: [
        'google.maps.Map',
        'google.maps.places.PlacesService',
      ],
    },
  ],

  // 型安全性の強化
  '@typescript-eslint/consistent-type-assertions': [
    'error',
    {
      assertionStyle: 'as',
      objectLiteralTypeAssertions: 'allow-as-parameter',
    },
  ],

  // nullチェックの強制
  '@typescript-eslint/no-non-null-assertion': 'error',

  // 未使用変数の警告
  '@typescript-eslint/no-unused-vars': [
    'warn',
    {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
    },
  ],
};
```
