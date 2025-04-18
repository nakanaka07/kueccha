/**
 * POI関連のユーティリティ関数
 */
import { MAX_DEBUG_DATA_LENGTH, WHITESPACE_REGEX } from '@/constants/poi';
import { logger } from '@/utils/logger';
// import { PointOfInterest } from '@/types/poi-types'; // summarizePOIData を使う場合は必要

const POI_COMPONENT = 'POIUtils'; // このファイル固有のコンポーネント名

/**
 * デバッグログに出力するオブジェクトのサイズを制限する
 * @param obj 対象オブジェクト
 * @param maxLength 最大文字数
 * @returns 制限されたオブジェクトまたは元のオブジェクト、あるいはエラー情報
 */
export function limitObjectSize<T>(
  obj: T,
  maxLength: number = MAX_DEBUG_DATA_LENGTH
): T | { message: string; length?: number } {
  try {
    // 循環参照に対応するため replacer を使用
    const cache = new Set();
    // 未使用の key 引数を _key に変更
    const str = JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          // Circular reference found, discard key
          return '[Circular]';
        }
        // Store value in our collection
        cache.add(value);
      }
      return value;
    });
    cache.clear(); // メモリ解放

    if (str.length > maxLength) {
      // 戻り値の型に合わせて修正
      return { message: `Object too large to log (>${maxLength} chars)`, length: str.length };
    }
    // 文字列化に成功し、長さ制限内であれば元のオブジェクトを返す (より安全)
    // 文字列化されたものを返すのではなく、元のオブジェクトを返すことで型情報を維持
    return obj;
  } catch /* (error) */ {
    // JSON.stringify が失敗した場合 (BigIntなど非対応型を含む場合など)
    // 変数 'e' は未使用のため削除
    logger.warn('Failed to stringify object for logging', {
      component: POI_COMPONENT,
      action: 'limitObjectSize',
    });
    // 戻り値の型に合わせて修正
    return { message: 'Failed to stringify object for logging' };
  }
}

/**
 * 検索用クエリを正規化する関数
 * @param query 検索クエリ文字列
 * @returns 正規化されたクエリ文字列
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return '';

  return query
    .toLowerCase()
    .normalize('NFKC') // 全角・半角の正規化
    .replace(WHITESPACE_REGEX, ' ') // 連続する空白を1つに
    .trim();
}

/**
 * 文字列フィールドに安全にアクセスする関数
 * @param value 元の値
 * @param defaultValue デフォルト値
 * @returns 値が存在する場合はその値、それ以外はデフォルト値
 */
export function safeString(value: string | undefined, defaultValue: string): string {
  return typeof value === 'string' ? value : defaultValue;
}

/*
// YAGNI原則に基づき、現在未使用のためコメントアウト
// 必要になった時点でコメント解除または再実装する

/**
 * 大きなPOIデータセットの要約情報を生成
 * @param pois POIデータの配列
 * @returns 要約統計情報
 * /
export function summarizePOIData(pois: PointOfInterest[]): Record<string, unknown> {
  // 配列が空の場合は早期リターン
  if (pois.length === 0) {
    return { count: 0 };
  }

  // 要約統計情報を構築
  const types = new Set<string>();
  const categories = new Set<string>();
  const districts = new Set<string>();
  let closedCount = 0;
  let missingLocationCount = 0;

  // データを分析
  pois.forEach(poi => {
    // POIタイプを集計
    types.add(poi.type);

    // カテゴリー情報を集計
    if (typeof poi.category === 'string' && poi.category.length > 0) {
      categories.add(poi.category);
    }

    if (poi.categories && Array.isArray(poi.categories)) {
      poi.categories.forEach(cat => {
        if (typeof cat === 'string' && cat.length > 0) {
          categories.add(cat);
        }
      });
    }

    // 地区情報を集計
    if (typeof poi.district === 'string' && poi.district.length > 0) {
      districts.add(poi.district);
    }

    // 閉店情報を集計
    if (poi.isClosed === true) {
      closedCount++;
    }

    // 位置情報の欠損を集計 (DEFAULT_LAT, DEFAULT_LNG をインポートする必要あり)
    // const isDefaultLocation = poi.lat === DEFAULT_LAT && poi.lng === DEFAULT_LNG;
    // if (isDefaultLocation) {
    //   missingLocationCount++;
    // }
  });

  // サンプルPOIを最大3件抽出
  const sampleItems = pois.slice(0, 3).map(poi => ({
    id: poi.id,
    name: poi.name,
    type: poi.type,
    isClosed: poi.isClosed,
  }));

  return {
    count: pois.length,
    types: [...types],
    typeDistribution: getDistributionByKey(pois, 'type'),
    categories: [...categories],
    districts: [...districts],
    closedCount,
    activeCount: pois.length - closedCount,
    missingLocationCount,
    withLocationCount: pois.length - missingLocationCount,
    sampleItems,
  };
}

/**
 * 特定のキーに基づく分布を計算
 * @param items データ配列
 * @param key 分布の基準となるキー
 * @returns キーごとの件数分布
 * /
function getDistributionByKey<T, K extends keyof T>(items: T[], key: K): Record<string, number> {
  // Map を使用して安全に集計を行い、最後に通常のオブジェクトに変換する
  const distributionMap = new Map<string, number>();
  // 安全なカウント集計
  items.forEach(item => {
    // 安全にプロパティにアクセス
    // eslint-disable-next-line security/detect-object-injection
    const value = item ? item[key] : undefined;
    const valueStr = String(value ?? 'unknown');
    // __proto__ など、プロトタイプ汚染につながる可能性のあるキーはスキップ
    if (valueStr === '__proto__' || valueStr === 'constructor' || valueStr === 'prototype') {
      logger.warn('Skipping potentially unsafe key in getDistributionByKey', { key: valueStr });
      return;
    }
    const currentCount = distributionMap.get(valueStr) || 0;
    distributionMap.set(valueStr, currentCount + 1);
  });
  // Map から安全なオブジェクトに変換 (プロトタイプを持たないオブジェクトを使用)
  const result: Record<string, number> = Object.create(null);
  distributionMap.forEach((count, key) => {
    // 直接代入を使用して警告を回避
    // eslint-disable-next-line security/detect-object-injection
    result[key] = count;
  });

  return result;
}
*/
