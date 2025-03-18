/**
 * ブラウザストレージアダプター実装
 *
 * ブラウザのlocalStorageとsessionStorageを抽象化し、
 * 型安全で一貫したインターフェースを提供します。
 */

import { isBrowser } from '../utils/env.utils';
import { createError } from '../utils/error.utils';

import { StorageAdapter } from './index';

/**
 * ストレージタイプの列挙型
 */
export enum StorageType {
  LOCAL = 'local',
  SESSION = 'session',
}

/**
 * ストレージアイテムのメタデータ
 */
interface StorageMetadata {
  timestamp: number;
  expiry?: number; // 期限（ミリ秒単位）
}

/**
 * シリアライズされたストレージアイテム
 */
interface StorageItem<T> {
  value: T;
  meta: StorageMetadata;
}

/**
 * ストレージオプション
 */
export interface StorageOptions {
  /**
   * データの有効期限（ミリ秒）
   */
  expiry?: number;

  /**
   * 暗号化キー（将来的な機能）
   */
  encryptionKey?: string;
}

/**
 * ブラウザストレージへのアクセスを抽象化するアダプター
 */
export class BrowserStorageAdapter implements StorageAdapter {
  private storage: Storage | null = null;
  private readonly storageType: StorageType;

  /**
   * コンストラクタ
   * @param type ストレージタイプ（LOCAL または SESSION）
   */
  constructor(type: StorageType) {
    this.storageType = type;

    if (isBrowser()) {
      try {
        this.storage = type === StorageType.LOCAL ? window.localStorage : window.sessionStorage;

        // ストレージ利用可能性のテスト
        this.testStorage();
      } catch (error) {
        console.warn(`${type} storage is not available:`, error);
        this.storage = null;
      }
    }
  }

  /**
   * ストレージが利用可能かテストする
   */
  private testStorage(): boolean {
    if (!this.storage) return false;

    const testKey = `__storage_test_${Date.now()}`;

    try {
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 値をシリアライズする
   * @param value シリアライズする値
   * @param options オプション
   */
  private serialize<T>(value: T, options?: StorageOptions): string {
    const item: StorageItem<T> = {
      value,
      meta: {
        timestamp: Date.now(),
        expiry: options?.expiry ? Date.now() + options.expiry : undefined,
      },
    };

    try {
      return JSON.stringify(item);
    } catch (error) {
      throw createError('DATA', 'SERIALIZATION_FAILED', 'データをシリアライズできませんでした', { value });
    }
  }

  /**
   * シリアライズされた文字列から値をパースする
   * @param data シリアライズされた文字列
   */
  private deserialize<T>(data: string): StorageItem<T> {
    try {
      return JSON.parse(data) as StorageItem<T>;
    } catch (error) {
      throw createError('DATA', 'DESERIALIZATION_FAILED', 'データをデシリアライズできませんでした', { data });
    }
  }

  /**
   * アイテムの有効期限が切れているかチェックする
   * @param item ストレージアイテム
   */
  private isExpired<T>(item: StorageItem<T>): boolean {
    return typeof item.meta.expiry === 'number' && Date.now() > item.meta.expiry;
  }

  /**
   * アイテムを保存する
   * @param key キー
   * @param value 値
   * @param options ストレージオプション
   */
  setItem<T>(key: string, value: T, options?: StorageOptions): boolean {
    if (!this.storage) return false;

    try {
      const serialized = this.serialize<T>(value, options);
      this.storage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  /**
   * アイテムを取得する
   * @param key キー
   * @param defaultValue デフォルト値
   */
  getItem<T>(key: string, defaultValue: T): T {
    if (!this.storage) return defaultValue;

    try {
      const data = this.storage.getItem(key);
      if (!data) return defaultValue;

      const item = this.deserialize<T>(data);

      // 有効期限チェック
      if (this.isExpired(item)) {
        this.removeItem(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return defaultValue;
    }
  }

  /**
   * キーを指定してアイテムを削除
   * @param key 削除するアイテムのキー
   */
  removeItem(key: string): boolean {
    if (!this.storage) return false;

    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  /**
   * ストレージを完全にクリア
   */
  clear(): boolean {
    if (!this.storage) return false;

    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * 期限切れのすべてのアイテムを削除
   */
  cleanExpired(): void {
    if (!this.storage) return;

    try {
      const keysToRemove: string[] = [];

      // すべてのキーをイテレーション
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (!key) continue;

        const data = this.storage.getItem(key);
        if (!data) continue;

        try {
          const item = this.deserialize<unknown>(data);
          if (this.isExpired(item)) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // デシリアライズに失敗したアイテムはスキップ
          continue;
        }
      }

      // 期限切れのアイテムを削除
      keysToRemove.forEach((key) => this.removeItem(key));
    } catch (error) {
      console.error('Failed to clean expired items:', error);
    }
  }

  /**
   * 指定されたキーが存在するか確認
   * @param key チェックするキー
   */
  hasItem(key: string): boolean {
    if (!this.storage) return false;

    try {
      const data = this.storage.getItem(key);
      if (!data) return false;

      const item = this.deserialize<unknown>(data);
      if (this.isExpired(item)) {
        this.removeItem(key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 現在のストレージタイプを取得
   */
  getStorageType(): StorageType {
    return this.storageType;
  }

  /**
   * ストレージが利用可能かどうかを確認
   */
  isAvailable(): boolean {
    return this.storage !== null;
  }
}

/**
 * LocalStorageアダプターのファクトリ関数
 */
export function createLocalStorageAdapter(): StorageAdapter {
  return new BrowserStorageAdapter(StorageType.LOCAL);
}

/**
 * SessionStorageアダプターのファクトリ関数
 */
export function createSessionStorageAdapter(): StorageAdapter {
  return new BrowserStorageAdapter(StorageType.SESSION);
}

/**
 * 適切なストレージアダプターを作成するファクトリ関数
 * @param type ストレージタイプ
 * @param fallback フォールバックするかどうか
 */
export function createStorageAdapter(type: StorageType, fallback: boolean = true): StorageAdapter {
  const adapter = new BrowserStorageAdapter(type);

  // 指定されたストレージが利用できない場合にフォールバック
  if (!adapter.isAvailable() && fallback) {
    console.warn(`${type} storage is not available, falling back to memory storage`);
    return new MemoryStorageAdapter();
  }

  return adapter;
}

/**
 * メモリ内ストレージ（フォールバック用）
 */
class MemoryStorageAdapter implements StorageAdapter {
  private storage: Map<string, string> = new Map();

  setItem<T>(key: string, value: T): boolean {
    try {
      const item: StorageItem<T> = {
        value,
        meta: { timestamp: Date.now() },
      };
      this.storage.set(key, JSON.stringify(item));
      return true;
    } catch (error) {
      return false;
    }
  }

  getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = this.storage.get(key);
      if (!data) return defaultValue;

      const item = JSON.parse(data) as StorageItem<T>;
      if (item.meta.expiry && Date.now() > item.meta.expiry) {
        this.removeItem(key);
        return defaultValue;
      }

      return item.value;
    } catch (error) {
      return defaultValue;
    }
  }

  removeItem(key: string): boolean {
    this.storage.delete(key);
    return true;
  }

  clear(): boolean {
    this.storage.clear();
    return true;
  }

  isAvailable(): boolean {
    return true;
  }
}
