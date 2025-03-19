/**
 * ストレージ操作関連のユーティリティ関数
 *
 * ローカルストレージとセッションストレージを操作するための便利な関数を提供します。
 * キャッシュ、有効期限、シリアライズ/デシリアライズなどの機能を含みます。
 */

// ============================================================================
// 型定義
// ============================================================================

/**
 * ストレージタイプの列挙型
 */
export enum StorageType {
  LOCAL = 'localStorage',
  SESSION = 'sessionStorage',
}

/**
 * キャッシュエントリの型定義
 */
interface CacheEntry<T> {
  data: T;
  expiry: number | null;
  created: number;
}

/**
 * ストレージオプションの型定義
 */
export interface StorageOptions {
  /**
   * データの有効期限（ミリ秒）
   * nullの場合は有効期限なし
   */
  expiry?: number | null;

  /**
   * 使用するストレージタイプ
   * デフォルトはローカルストレージ
   */
  storageType?: StorageType;

  /**
   * キー名のプレフィックス
   * アプリケーション間の名前空間を分けるのに便利
   */
  prefix?: string;
}

/**
 * デフォルトのストレージオプション
 */
const DEFAULT_OPTIONS: StorageOptions = {
  expiry: null,
  storageType: StorageType.LOCAL,
  prefix: 'kueccha:',
};

/**
 * アプリ固有のストレージキー
 */
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

// ============================================================================
// ヘルパー関数
// ============================================================================

/**
 * ブラウザがストレージをサポートしているかチェック
 *
 * @param type ストレージタイプ
 * @returns サポートされている場合はtrue、そうでなければfalse
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

/**
 * キー名にプレフィックスを適用
 *
 * @param key 元のキー
 * @param prefix 適用するプレフィックス
 * @returns プレフィックスが付いたキー名
 */
function applyPrefix(key: string, prefix?: string): string {
  return prefix ? `${prefix}${key}` : key;
}

/**
 * 適切なストレージオブジェクトを取得
 *
 * @param type ストレージタイプ
 * @returns ストレージオブジェクト
 */
function getStorage(type: StorageType): Storage {
  return window[type];
}

/**
 * オブジェクトをJSON文字列に変換
 *
 * @param value 変換する値
 * @returns JSON文字列
 */
function serialize<T>(value: T): string {
  return JSON.stringify(value);
}

/**
 * JSON文字列をオブジェクトに変換
 *
 * @param value 変換する文字列
 * @returns パースされたオブジェクト、または失敗した場合はnull
 */
function deserialize<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    console.error('Failed to deserialize storage value', e);
    return null;
  }
}

/**
 * データを有効期限付きのキャッシュエントリにラップする
 *
 * @param data 保存するデータ
 * @param expiry 有効期限（ミリ秒）
 * @returns キャッシュエントリオブジェクト
 */
function wrapInCacheEntry<T>(data: T, expiry: number | null): CacheEntry<T> {
  return {
    data,
    expiry,
    created: Date.now(),
  };
}

/**
 * キャッシュエントリが有効かチェックする
 *
 * @param entry チェックするキャッシュエントリ
 * @returns 有効な場合はtrue、期限切れの場合はfalse
 */
function isEntryValid<T>(entry: CacheEntry<T>): boolean {
  if (entry.expiry === null) return true;
  return Date.now() < entry.created + entry.expiry;
}

// ============================================================================
// 基本ストレージ操作
// ============================================================================

/**
 * データをストレージに保存
 *
 * @param key 保存するキー
 * @param value 保存する値
 * @param options ストレージオプション
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
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
 *
 * @param key 取得するキー
 * @param defaultValue キーが存在しない場合のデフォルト値
 * @param options ストレージオプション
 * @returns 保存された値、または失敗した場合はデフォルト値
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
 *
 * @param key 削除するキー
 * @param options ストレージオプション
 * @returns 削除に成功した場合はtrue、失敗した場合はfalse
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
 *
 * @param options ストレージオプション
 * @returns クリアに成功した場合はtrue、失敗した場合はfalse
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
 *
 * @param key チェックするキー
 * @param options ストレージオプション
 * @returns キーが存在する場合はtrue、そうでなければfalse
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
 * ストレージ内のすべてのキーを取得
 *
 * @param options ストレージオプション
 * @returns キーの配列
 */
export function getAllKeys(options: StorageOptions = {}): string[] {
  const { storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return [];
    }

    const storage = getStorage(storageType!);
    const keys: string[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null) {
        // プレフィックスでフィルタリング
        if (!prefix || key.startsWith(prefix)) {
          // プレフィックスを取り除いたキーを追加
          const actualKey = prefix ? key.substring(prefix.length) : key;
          keys.push(actualKey);
        }
      }
    }

    return keys;
  } catch (e) {
    console.error('Failed to get all keys', e);
    return [];
  }
}

// ============================================================================
// 高度なストレージ操作
// ============================================================================

/**
 * 期限切れのアイテムを削除し、ストレージを整理する
 *
 * @param options ストレージオプション
 * @returns 削除されたアイテムの数
 */
export function cleanExpiredItems(options: StorageOptions = {}): number {
  const { storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return 0;
    }

    const storage = getStorage(storageType!);
    const keysToRemove: string[] = [];

    // 期限切れのアイテムを特定
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key === null) continue;

      // プレフィックスでフィルタリング
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }

      const value = storage.getItem(key);
      if (value === null) continue;

      try {
        const parsed = deserialize<CacheEntry<any>>(value);
        if (parsed && !isEntryValid(parsed)) {
          keysToRemove.push(key);
        }
      } catch (e) {
        // JSONパースエラーの場合は無視
      }
    }

    // 期限切れのアイテムを削除
    for (const key of keysToRemove) {
      storage.removeItem(key);
    }

    return keysToRemove.length;
  } catch (e) {
    console.error('Failed to clean expired items', e);
    return 0;
  }
}

/**
 * 指定されたキーのデータを更新
 * 既存のエントリの一部のみを更新するのに便利
 *
 * @param key 更新するキー
 * @param updateFunction 更新関数
 * @param options ストレージオプション
 * @returns 更新に成功した場合はtrue、失敗した場合はfalse
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

/**
 * ストレージの使用量を計算（バイト単位）
 *
 * @param options ストレージオプション
 * @returns ストレージ使用量（バイト）
 */
export function getStorageSize(options: StorageOptions = {}): number {
  const { storageType, prefix } = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (!isStorageAvailable(storageType!)) {
      return 0;
    }

    const storage = getStorage(storageType!);
    let totalSize = 0;

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key === null) continue;

      // プレフィックスでフィルタリング
      if (prefix && !key.startsWith(prefix)) {
        continue;
      }

      const value = storage.getItem(key);
      if (value !== null) {
        // キーとバリューのサイズを計算（UTF-16エンコーディングでは各文字が2バイト）
        totalSize += (key.length + value.length) * 2;
      }
    }

    return totalSize;
  } catch (e) {
    console.error('Failed to calculate storage size', e);
    return 0;
  }
}

/**
 * ストレージの容量を人間が読みやすい形式で表示
 *
 * @param bytes バイト数
 * @returns 読みやすいサイズ表記
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// アプリ固有のストレージ操作
// ============================================================================

/**
 * ユーザー設定を保存
 *
 * @param preferences ユーザー設定オブジェクト
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
 */
export function saveUserPreferences<T>(preferences: T): boolean {
  // ユーザー設定は長期保存（1年）
  return setItem(STORAGE_KEYS.USER_PREFERENCES, preferences, {
    expiry: 365 * 24 * 60 * 60 * 1000, // 1年
  });
}

/**
 * ユーザー設定を取得
 *
 * @param defaultPreferences デフォルト設定
 * @returns ユーザー設定オブジェクト
 */
export function getUserPreferences<T>(defaultPreferences: T): T {
  return getItem(STORAGE_KEYS.USER_PREFERENCES, defaultPreferences);
}

/**
 * 最近の検索履歴を保存
 *
 * @param searches 検索文字列の配列
 * @param maxItems 保存する最大アイテム数
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
 */
export function saveRecentSearches(searches: string[], maxItems: number = 10): boolean {
  // 重複を削除し、最新のものを先頭に
  const uniqueSearches = Array.from(new Set(searches)).slice(0, maxItems);

  return setItem(STORAGE_KEYS.RECENT_SEARCHES, uniqueSearches, {
    expiry: 30 * 24 * 60 * 60 * 1000, // 30日
  });
}

/**
 * 最近の検索履歴を取得
 *
 * @returns 検索文字列の配列
 */
export function getRecentSearches(): string[] {
  return getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
}

/**
 * お気に入りPOIを保存
 *
 * @param poiIds お気に入りPOI IDの配列
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
 */
export function saveFavorites(poiIds: string[]): boolean {
  // お気に入りは長期保存（1年）
  return setItem(STORAGE_KEYS.FAVORITES, poiIds, {
    expiry: 365 * 24 * 60 * 60 * 1000, // 1年
  });
}

/**
 * お気に入りPOIを取得
 *
 * @returns お気に入りPOI IDの配列
 */
export function getFavorites(): string[] {
  return getItem<string[]>(STORAGE_KEYS.FAVORITES, []);
}

/**
 * POIをお気に入りに追加
 *
 * @param poiId 追加するPOI ID
 * @returns 追加に成功した場合はtrue、失敗した場合はfalse
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
 *
 * @param poiId 削除するPOI ID
 * @returns 削除に成功した場合はtrue、失敗した場合はfalse
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
 * POIがお気に入り登録されているかチェック
 *
 * @param poiId チェックするPOI ID
 * @returns お気に入りの場合はtrue、そうでなければfalse
 */
export function isFavorite(poiId: string): boolean {
  const favorites = getFavorites();
  return favorites.includes(poiId);
}

/**
 * 最後のマップ位置と拡大レベルを保存
 *
 * @param position 緯度経度位置
 * @param zoom 拡大レベル
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
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
 *
 * @param defaultPosition デフォルト位置
 * @returns 保存された位置または、デフォルト位置
 */
export function getMapPosition(defaultPosition: { lat: number; lng: number }): {
  lat: number;
  lng: number;
} {
  return getItem(STORAGE_KEYS.LAST_POSITION, defaultPosition);
}

/**
 * 最後のマップ拡大レベルを取得
 *
 * @param defaultZoom デフォルト拡大レベル
 * @returns 保存された拡大レベルまたはデフォルト拡大レベル
 */
export function getMapZoom(defaultZoom: number): number {
  return getItem(STORAGE_KEYS.MAP_ZOOM, defaultZoom);
}

/**
 * フィルタ設定を保存
 *
 * @param filterSettings フィルタ設定オブジェクト
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
 */
export function saveFilterSettings<T>(filterSettings: T): boolean {
  return setItem(STORAGE_KEYS.FILTER_SETTINGS, filterSettings, {
    expiry: 30 * 24 * 60 * 60 * 1000, // 30日
  });
}

/**
 * フィルタ設定を取得
 *
 * @param defaultSettings デフォルト設定
 * @returns フィルタ設定オブジェクト
 */
export function getFilterSettings<T>(defaultSettings: T): T {
  return getItem(STORAGE_KEYS.FILTER_SETTINGS, defaultSettings);
}

/**
 * 表示したPOIの履歴を保存
 *
 * @param poiIds POI IDの配列
 * @param maxItems 保存する最大アイテム数
 * @returns 保存に成功した場合はtrue、失敗した場合はfalse
 */
export function saveViewedPois(poiIds: string[], maxItems: number = 50): boolean {
  // 重複を削除し、最大数に制限
  const uniquePois = Array.from(new Set(poiIds)).slice(0, maxItems);

  return setItem(STORAGE_KEYS.VIEWED_POIS, uniquePois, {
    expiry: 30 * 24 * 60 * 60 * 1000, // 30日
  });
}

/**
 * 表示したPOIの履歴を取得
 *
 * @returns POI IDの配列
 */
export function getViewedPois(): string[] {
  return getItem<string[]>(STORAGE_KEYS.VIEWED_POIS, []);
}

/**
 * POIを表示履歴に追加
 *
 * @param poiId 追加するPOI ID
 * @param maxItems 保存する最大アイテム数
 * @returns 追加に成功した場合はtrue、失敗した場合はfalse
 */
export function addViewedPoi(poiId: string, maxItems: number = 50): boolean {
  return updateItem<string[]>(
    STORAGE_KEYS.VIEWED_POIS,
    (currentViewed) => {
      const viewed = currentViewed || [];
      // 既に存在する場合は削除して先頭に追加
      const filtered = viewed.filter((id) => id !== poiId);
      return [poiId, ...filtered].slice(0, maxItems);
    },
    { expiry: 30 * 24 * 60 * 60 * 1000 }, // 30日
  );
}

/**
 * キャッシュバージョンを更新
 * アプリのアップデート時などにキャッシュを無効化するのに使用
 *
 * @param version 新しいバージョン番号
 * @returns 更新に成功した場合はtrue、失敗した場合はfalse
 */
export function updateCacheVersion(version: string): boolean {
  return setItem(STORAGE_KEYS.CACHE_VERSION, version);
}

/**
 * キャッシュバージョンを取得
 *
 * @param defaultVersion デフォルトバージョン
 * @returns 保存されたバージョンまたはデフォルトバージョン
 */
export function getCacheVersion(defaultVersion: string = '1.0.0'): string {
  return getItem(STORAGE_KEYS.CACHE_VERSION, defaultVersion);
}

/**
 * キャッシュバージョンを確認し、変更があれば特定のキャッシュを削除
 *
 * @param currentVersion 現在のアプリバージョン
 * @param keysToReset リセットするキーの配列
 * @returns リセットが実行された場合はtrue、そうでなければfalse
 */
export function checkCacheVersion(currentVersion: string, keysToReset: string[] = []): boolean {
  const savedVersion = getCacheVersion(currentVersion);

  // バージョンが一致する場合は何もしない
  if (savedVersion === currentVersion) {
    return false;
  }

  // バージョンが異なる場合は指定されたキーをリセット
  for (const key of keysToReset) {
    removeItem(key);
  }

  // 新しいバージョンを保存
  updateCacheVersion(currentVersion);
  return true;
}
