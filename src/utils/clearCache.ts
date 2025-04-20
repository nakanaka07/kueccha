/**
 * アプリケーションのキャッシュをクリアするユーティリティ
 */

// ストレージキー定数
const STORAGE_KEYS = {
  POI_DATA: 'kueccha_poi_data_cache',
  POI_DATA_TIMESTAMP: 'kueccha_poi_data_timestamp',
};

/**
 * POIデータのキャッシュをクリアする
 *
 * @returns クリアしたキーの数
 */
export function clearPOICache(): number {
  let count = 0;

  try {
    // POIデータをクリア
    if (localStorage.getItem(STORAGE_KEYS.POI_DATA)) {
      localStorage.removeItem(STORAGE_KEYS.POI_DATA);
      count++;
    }

    // タイムスタンプをクリア
    if (localStorage.getItem(STORAGE_KEYS.POI_DATA_TIMESTAMP)) {
      localStorage.removeItem(STORAGE_KEYS.POI_DATA_TIMESTAMP);
      count++;
    }

    console.info(`POIデータキャッシュをクリアしました (${count}件のキーを削除)`);
    return count;
  } catch (error) {
    console.error('キャッシュクリア中にエラーが発生しました', error);
    return 0;
  }
}

/**
 * アプリケーション全体のキャッシュをクリア
 *
 * @param prefix キャッシュキーの接頭辞（指定した場合はそのキーのみクリア）
 * @returns クリアしたキーの数
 */
export function clearAllCache(prefix?: string): number {
  let count = 0;

  try {
    if (prefix) {
      // 指定した接頭辞のキーのみクリア
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
          count++;
        }
      });
    } else {
      // すべてのキャッシュをクリア
      const totalKeys = localStorage.length;
      localStorage.clear();
      count = totalKeys;
    }

    console.info(`アプリケーションキャッシュをクリアしました (${count}件のキーを削除)`);
    return count;
  } catch (error) {
    console.error('キャッシュクリア中にエラーが発生しました', error);
    return 0;
  }
}
