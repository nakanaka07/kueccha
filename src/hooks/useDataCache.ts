import { useState, useCallback, useEffect } from 'react';
import { clearCache as clearSheetCache } from '../services/sheets';

/**
 * データキャッシュを管理するフック
 */
export function useDataCache() {
  const [lastCacheCleared, setLastCacheCleared] = useState<Date | null>(null);

  // キャッシュをクリアする関数
  const clearCache = useCallback((areaKey?: string) => {
    clearSheetCache(areaKey);
    setLastCacheCleared(new Date());
  }, []);

  // アプリの初回起動時にキャッシュ情報をリセット
  useEffect(() => {
    const cacheInfo = {
      cleared: lastCacheCleared?.toISOString() || null
    };
    localStorage.setItem('cache_info', JSON.stringify(cacheInfo));
  }, [lastCacheCleared]);

  // アプリ起動時に前回のキャッシュ情報を復元
  useEffect(() => {
    const savedInfo = localStorage.getItem('cache_info');
    if (savedInfo) {
      try {
        const info = JSON.parse(savedInfo);
        if (info.cleared) {
          setLastCacheCleared(new Date(info.cleared));
        }
      } catch (e) {
        console.error('キャッシュ情報の解析に失敗:', e);
      }
    }
  }, []);

  return {
    clearCache,
    lastCacheCleared,
  };
}