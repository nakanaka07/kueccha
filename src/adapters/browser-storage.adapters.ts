import { isBrowser } from '../utils/env.utils';
import { createError } from '../utils/error.utils';

import type { StorageAdapter } from './index';

export enum StorageType {
  LOCAL = 'local',
  SESSION = 'session',
}

interface StorageMetadata {
  timestamp: number;
  expiry?: number;
}

interface StorageItem<T> {
  value: T;
  meta: StorageMetadata;
}

export interface StorageOptions {
  expiry?: number;
  encryptionKey?: string;
}

export class BrowserStorageAdapter implements StorageAdapter {
  private storage: Storage | null = null;
  private readonly storageType: StorageType;

  constructor(type: StorageType) {
    this.storageType = type;
    if (isBrowser()) {
      try {
        this.storage = type === StorageType.LOCAL ? window.localStorage : window.sessionStorage;
        this.testStorage();
      } catch (error) {
        console.warn(`${type} storage is not available:`, error);
        this.storage = null;
      }
    }
  }

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
      throw createError('DATA', 'SERIALIZATION_FAILED', 'データをシリアライズできませんでした', {
        value,
      });
    }
  }

  private deserialize<T>(data: string): StorageItem<T> {
    try {
      return JSON.parse(data) as StorageItem<T>;
    } catch (error) {
      throw createError(
        'DATA',
        'DESERIALIZATION_FAILED',
        'データをデシリアライズできませんでした',
        { data },
      );
    }
  }

  private isExpired<T>(item: StorageItem<T>): boolean {
    return typeof item.meta.expiry === 'number' && Date.now() > item.meta.expiry;
  }

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

  getItem<T>(key: string, defaultValue: T): T {
    if (!this.storage) return defaultValue;
    try {
      const data = this.storage.getItem(key);
      if (!data) return defaultValue;
      const item = this.deserialize<T>(data);

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

  cleanExpired(): void {
    if (!this.storage) return;
    try {
      const keysToRemove: string[] = [];

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
          continue;
        }
      }

      keysToRemove.forEach((key) => this.removeItem(key));
    } catch (error) {
      console.error('Failed to clean expired items:', error);
    }
  }

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

  getStorageType(): StorageType {
    return this.storageType;
  }

  isAvailable(): boolean {
    return this.storage !== null;
  }
}

export function createLocalStorageAdapter(): StorageAdapter {
  return new BrowserStorageAdapter(StorageType.LOCAL);
}

export function createSessionStorageAdapter(): StorageAdapter {
  return new BrowserStorageAdapter(StorageType.SESSION);
}

export function createStorageAdapter(type: StorageType, fallback: boolean = true): StorageAdapter {
  const adapter = new BrowserStorageAdapter(type);

  if (!adapter.isAvailable() && fallback) {
    console.warn(`${type} storage is not available, falling back to memory storage`);
    return new MemoryStorageAdapter();
  }
  return adapter;
}

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
