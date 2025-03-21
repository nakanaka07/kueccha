/**
 * ストレージ操作関連のユーティリティ関数
 *
 * ローカルストレージとセッションストレージを操作するための便利な関数を提供します。
 * キャッシュ、有効期限、シリアライズ/デシリアライズなどの機能を含みます。
 */

// 型定義
export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage',
}

interface CacheEntry<T> {
  data: T;
  expiry: number | null;
  created: number;
}

export interface StorageOptions {
  expiry?: number | null;
  storageType?: StorageType;
  prefix?: string;
}

// デフォルト設定
const DEFAULT_OPTIONS: StorageOptions = {
  expiry: null,
  storageType: StorageType.LOCAL,
  prefix: 'kueccha:',
};

// アプリ固有のストレージキー
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches',
  FAVORITES: 'favorites',
  VIEWED_POIS: 'viewed_pois',
  LANGUAGE: 'language',
  LAST_POSITION: 'last_position',
  MAP_ZOOM: 'map_zoom',
  FILTER_SETTINGS: 'filter_settings',
  CACHE_VERSION: 'cache_version',
} as const;

// ヘルパー関数
/**
 * ブラウザがストレージをサポートしているかチェック
 */
export function isStorageAvailable(type: StorageType): boolean {
  try {
    const storage = window[type];
    const testKey = `__storage_test__${Date.now()}`;
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// 内部ヘルパー関数
function applyPrefix(key: string, prefix?: string): string {
  return prefix ? `${prefix}${key}` : key;
}

function getStorage(type: StorageType): Storage {
  return window[type];
}

function serialize<T>(value: T): string {
  return JSON.stringify(value);
}

function deserialize<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    console.error('Failed to deserialize storage value', e);
    return null;
  }
}

function wrapInCacheEntry<T>(data: T, expiry: number | null): CacheEntry<T> {
  return {
    data,
    expiry,
    created: Date.now(),
  };
}

function isEntryValid<T>(entry: CacheEntry<T>): boolean {
  if (entry.expiry === null) return true;
  return Date.now() < entry.created + entry.expiry;
}

// 基本ストレージ操作
/**
 * データをストレージに保存
 */
export function setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
  const { expiry, storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return false;
    }

    const prefixedKey = applyPrefix(key, prefix);
    const valueToStore = wrapInCacheEntry(value, expiry!);
    const serialized = serialize(valueToStore);

    const storage = getStorage(storageType!);
    storage.setItem(prefixedKey, serialized);

    return true;
  } catch (e) {
    console.error(`Failed to store value for key ${key}`, e);
    return false;
  }
}

/**
 * ストレージからデータを取得
 */
export function getItem<T>(key: string, defaultValue: T, options: StorageOptions = {}): T {
  const { storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return defaultValue;
    }

    const prefixedKey = applyPrefix(key, prefix);
    const storage = getStorage(storageType!);
    const value = storage.getItem(prefixedKey);

    if (value === null) {
      return defaultValue;
    }

    const parsed = deserialize<CacheEntry<T>>(value);
    if (!parsed) {
      return defaultValue;
    }

    // 有効期限をチェック
    if (!isEntryValid(parsed)) {
      // 期限切れのアイテムを削除
      storage.removeItem(prefixedKey);
      return defaultValue;
    }

    return parsed.data;
  } catch (e) {
    console.error(`Failed to retrieve value for key ${key}`, e);
    return defaultValue;
  }
}

/**
 * アイテムをストレージから削除
 */
export function removeItem(key: string, options: StorageOptions = {}): boolean {
  const { storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return false;
    }

    const prefixedKey = applyPrefix(key, prefix);
    const storage = getStorage(storageType!);
    storage.removeItem(prefixedKey);

    return true;
  } catch (e) {
    console.error(`Failed to remove item for key ${key}`, e);
    return false;
  }
}

/**
 * 指定したストレージの全アイテムを削除
 */
export function clear(options: StorageOptions = {}): boolean {
  const { storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return false;
    }

    const storage = getStorage(storageType!);

    // プレフィックスが指定されている場合は、そのプレフィックスを持つキーのみを削除
    if (prefix) {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) {
          storage.removeItem(key);
        }
      }
    } else {
      // プレフィックスがない場合はすべてクリア
      storage.clear();
    }

    return true;
  } catch (e) {
    console.error('Failed to clear storage', e);
    return false;
  }
}

/**
 * 指定されたキーがストレージに存在するかチェック
 */
export function hasItem(key: string, options: StorageOptions = {}): boolean {
  const { storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return false;
    }

    const prefixedKey = applyPrefix(key, prefix);
    const storage = getStorage(storageType!);
    const value = storage.getItem(prefixedKey);

    if (value === null) {
      return false;
    }

    // 期限切れをチェック
    const parsed = deserialize<CacheEntry<any>>(value);
    if (!parsed) {
      return false;
    }

    return isEntryValid(parsed);
  } catch (e) {
    return false;
  }
}

/**
 * 指定されたキーのデータを更新
 */
export function updateItem<T>(
  key: string,
  updateFunction: (currentValue: T | null) => T,
  options: StorageOptions = {},
): boolean {
  const { storageType, expiry, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return false;
    }

    const prefixedKey = applyPrefix(key, prefix);
    const storage = getStorage(storageType!);
    const value = storage.getItem(prefixedKey);

    let currentData: T | null = null;

    if (value !== null) {
      const parsed = deserialize<CacheEntry<T>>(value);
      if (parsed && isEntryValid(parsed)) {
        currentData = parsed.data;
      }
    }

    // 更新関数を呼び出して新しいデータを取得
    const updatedData = updateFunction(currentData);

    // 新しいデータを保存
    const cacheEntry = wrapInCacheEntry(updatedData, expiry!);
    const serialized = serialize(cacheEntry);
    storage.setItem(prefixedKey, serialized);

    return true;
  } catch (e) {
    console.error(`Failed to update item for key ${key}`, e);
    return false;
  }
}

// よく使用されるアプリ固有の操作
/**
 * ユーザー設定を保存
 */
export function saveUserPreferences<T>(preferences: T): boolean {
  return setItem(STORAGE_KEYS.USER_PREFERENCES, preferences, {
    expiry: 365 * 24 * 60 * 60 * 1000, // 1年
  });
}

/**
 * ユーザー設定を取得
 */
export function getUserPreferences<T>(defaultPreferences: T): T {
  return getItem(STORAGE_KEYS.USER_PREFERENCES, defaultPreferences);
}

/**
 * お気に入りPOIを保存
 */
export function saveFavorites(poiIds: string[]): boolean {
  return setItem(STORAGE_KEYS.FAVORITES, poiIds, {
    expiry: 365 * 24 * 60 * 60 * 1000, // 1年
  });
}

/**
 * お気に入りPOIを取得
 */
export function getFavorites(): string[] {
  return getItem<string[]>(STORAGE_KEYS.FAVORITES, []);
}

/**
 * POIをお気に入りに追加
 */
export function addFavorite(poiId: string): boolean {
  return updateItem<string[]>(
    STORAGE_KEYS.FAVORITES,
    (currentFavorites) => {
      const favorites = currentFavorites || [];
      if (!favorites.includes(poiId)) {
        return [...favorites, poiId];
      }
      return favorites;
    },
    { expiry: 365 * 24 * 60 * 60 * 1000 }, // 1年
  );
}

/**
 * POIをお気に入りから削除
 */
export function removeFavorite(poiId: string): boolean {
  return updateItem<string[]>(
    STORAGE_KEYS.FAVORITES,
    (currentFavorites) => {
      const favorites = currentFavorites || [];
      return favorites.filter((id) => id !== poiId);
    },
    { expiry: 365 * 24 * 60 * 60 * 1000 }, // 1年
  );
}

/**
 * 最後のマップ位置と拡大レベルを保存
 */
export function saveMapPosition(position: { lat: number; lng: number }, zoom: number): boolean {
  setItem(STORAGE_KEYS.MAP_ZOOM, zoom, {
    expiry: 7 * 24 * 60 * 60 * 1000, // 1週間
  });

  return setItem(STORAGE_KEYS.LAST_POSITION, position, {
    expiry: 7 * 24 * 60 * 60 * 1000, // 1週間
  });
}

/**
 * 最後のマップ位置を取得
 */
export function getMapPosition(defaultPosition: { lat: number; lng: number }): {
  lat: number;
  lng: number;
} {
  return getItem(STORAGE_KEYS.LAST_POSITION, defaultPosition);
}

/**
 * 最後のマップ拡大レベルを取得
 */
export function getMapZoom(defaultZoom: number): number {
  return getItem(STORAGE_KEYS.MAP_ZOOM, defaultZoom);
}
