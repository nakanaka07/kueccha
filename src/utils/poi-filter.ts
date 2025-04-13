/**
 * POIデータのフィルタリング関連ロジック
 */
import { normalizeSearchQuery, limitObjectSize } from './poi-utils'; // poi-utils からインポート

import {
  PointOfInterest,
  POIFilterOptions,
  POIType,
  POICategory,
  District,
} from '@/types/poi-types';
import { getEnvVar } from '@/utils/env/core';
import { toBool } from '@/utils/env/transforms';
import { logger } from '@/utils/logger';

const POI_COMPONENT = 'POIFilter'; // このファイル固有のコンポーネント名

// 環境変数からデバッグモードの設定を取得
const debugModeStr = getEnvVar({
  key: 'VITE_DEBUG_MODE',
  defaultValue: 'false',
});
// 文字列をブール値に変換
const DEBUG_MODE = toBool(debugModeStr);

/**
 * POIデータをフィルタリングする関数
 * パフォーマンスを考慮した実装
 * @param pois POIデータの配列
 * @param options フィルタリングオプション
 * @returns フィルタリングされたPOIデータの配列
 */
export function filterPOIs(pois: PointOfInterest[], options?: POIFilterOptions): PointOfInterest[] {
  // シンプルな関数で実装（KISS原則に従う）
  if (pois === undefined || pois.length === 0) {
    return [];
  }

  // オプションが未指定なら全データを返す
  if (options === undefined || Object.keys(options).length === 0) {
    return pois;
  }

  // 処理開始をログに記録（必要な場合のみ）
  if (DEBUG_MODE) {
    logger.debug('POIフィルタリング開始', {
      component: POI_COMPONENT,
      totalCount: pois.length,
      options: limitObjectSize(options), // limitObjectSize を使用
    });
  }

  // 正規化されたキーワード（一度だけ計算）
  const normalizedKeyword = options.keyword ? normalizeSearchQuery(options.keyword) : undefined;

  // 各フィルタ条件を個別関数に分割して複雑度を下げる
  const filtered = pois.filter(poi => {
    // 各フィルタ条件をチェック - いずれかが false なら除外
    return (
      passesClosedFilter(poi, options) &&
      passesTypeFilter(poi, options) &&
      passesCategoryFilter(poi, options) &&
      passesDistrictFilter(poi, options) &&
      passesParkingFilter(poi, options) &&
      passesCashlessFilter(poi, options) &&
      passesKeywordFilter(poi, normalizedKeyword)
      // TODO: isOpenNow フィルターの実装
    );
  });

  // フィルタリング結果をログに記録（必要な場合のみ）
  if (DEBUG_MODE) {
    logger.debug('POIフィルタリング結果', {
      component: POI_COMPONENT,
      action: 'filter_pois',
      totalCount: pois.length,
      filteredCount: filtered.length,
      options: limitObjectSize(options), // limitObjectSize を使用
    });
  }

  return filtered;
}

// --- フィルターヘルパー関数群 ---

function passesClosedFilter(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // excludeClosed が true の場合、isClosed が true の POI を除外
  return !(options.excludeClosed === true && poi.isClosed === true);
}

function passesTypeFilter(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // types オプションが指定されていなければ true
  if (!options.types || options.types.length === 0) {
    return true;
  }
  // POI の type が指定された types 配列に含まれていれば true
  return options.types.includes(poi.type);
}

function passesCategoryFilter(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // categories オプションが指定されていなければ true
  if (!options.categories || options.categories.length === 0) {
    return true;
  }
  // POI の categories 配列のいずれかが指定された categories 配列に含まれていれば true
  // POI の category (単数) も考慮する
  const poiCategories = poi.categories ?? (poi.category ? [poi.category] : []);
  if (poiCategories.length === 0) {
    // カテゴリ情報がないPOIは、カテゴリフィルターが指定されている場合は除外しない（仕様確認が必要）
    // もしカテゴリ指定時にカテゴリ不明を除外したい場合は false を返す
    return true;
  }
  return poiCategories.some(cat => options.categories?.includes(cat as POICategory)); // 型アサーションを追加
}

function passesDistrictFilter(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // districts オプションが指定されていなければ true
  if (!options.districts || options.districts.length === 0) {
    return true;
  }
  // POI の district が指定された districts 配列に含まれていれば true
  // POI の district が string | number の可能性があるため、string に変換して比較
  return !!poi.district && options.districts.includes(String(poi.district) as District); // 型アサーションを追加
}

function passesParkingFilter(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // hasParking オプションが true でなければ true (フィルターしない)
  if (options.hasParking !== true) {
    return true;
  }
  // POI の hasParking が true であれば true
  return poi.hasParking === true;
}

function passesCashlessFilter(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // hasCashless オプションが true でなければ true (フィルターしない)
  if (options.hasCashless !== true) {
    return true;
  }
  // POI の hasCashless が true であれば true
  return poi.hasCashless === true;
}

function passesKeywordFilter(poi: PointOfInterest, normalizedKeyword?: string): boolean {
  // キーワードが指定されていなければ true
  if (!normalizedKeyword) {
    return true;
  }
  // POI の searchText がキーワードを含んでいれば true
  // searchText が undefined の可能性も考慮
  return !!poi.searchText && poi.searchText.includes(normalizedKeyword);
}

// TODO: isOpenNow フィルターの実装
// function passesOpenNowFilter(poi: PointOfInterest, options: POIFilterOptions): boolean {
//   if (options.isOpenNow !== true) {
//     return true;
//   }
//   // 現在時刻と POI の営業時間・定休日情報を比較するロジック
//   // ... 実装 ...
//   return false; // 仮
// }
