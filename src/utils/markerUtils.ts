// 型のインポートは明示的にimport type構文を使用
import type { POIType, POICategory, PointOfInterest } from '@/types/poi';
import { ENV } from '@/utils/env';
import { logger } from '@/utils/logger';

/**
 * マーカーアイコンの設定インターフェース
 */
export interface MarkerIconOptions {
  /** アイコンのURL */
  url: string;
  /** アイコンのサイズ (ピクセル) */
  size?: google.maps.Size;
  /** アイコンのスケーリングサイズ */
  scaledSize?: google.maps.Size;
  /** アイコンのアンカー位置 */
  anchor?: google.maps.Point;
  /** アイコンの原点 */
  origin?: google.maps.Point;
  /** アイコンの透明度 (0-1) */
  opacity?: number;
}

/**
 * マーカーの表示状態を表す型
 */
export type MarkerVisibility = {
  [key in POIType]: boolean;
};

/**
 * カテゴリフィルターの状態を表す型
 */
export type CategoryFilter = {
  [key in POICategory]: boolean;
};

/**
 * POIの種類に基づくマーカーアイコンのベースURL
 * 各タイプごとにGoogle Maps Platform Icon APIで使用される識別子を定義
 */
const POI_TYPE_ICON_BASE: Record<POIType, string> = {
  restaurant: 'restaurant',
  shop: 'shopping',
  attraction: 'attraction',
  toilet: 'toilets',
  parking: 'parking',
  other: 'info',
};

/**
 * POIカテゴリに基づくアイコンの色
 * 各カテゴリの視覚的な区別のための色コード（16進数）
 */
const CATEGORY_COLORS: Record<POICategory, string> = {
  japanese: '0095DA', // 青
  western: 'B8002B', // 赤
  other: 'FFC700', // 黄
  fusion: '7D0989', // 紫
  retail: '2E7D32', // 緑
  unspecified: '757575', // グレー
};

/**
 * POIの種類とカテゴリに基づいたマーカーアイコン設定を生成
 *
 * @param typeOrPoi POIの種類またはPOIオブジェクト
 * @param category POIのカテゴリ（typeがPOITypeの場合のみ使用）
 * @param isClosed 閉店しているかどうか（typeがPOITypeの場合のみ使用）
 * @returns マーカーアイコン設定
 */
export function getMarkerIcon(poi: PointOfInterest): MarkerIconOptions;
export function getMarkerIcon(
  type: POIType,
  category: POICategory,
  isClosed?: boolean
): MarkerIconOptions;
export function getMarkerIcon(
  typeOrPoi: POIType | PointOfInterest,
  category?: POICategory,
  isClosed = false
): MarkerIconOptions {
  try {
    // POIオブジェクトが渡された場合
    if (typeof typeOrPoi === 'object') {
      const poi = typeOrPoi;

      // 型安全な方法でプロパティを取得し処理
      const typeStr = poi.type;
      const categoryStr = poi.category ?? 'unspecified';

      const poiType = getPOITypeFromString(typeStr);
      const poiCategory = getCategoryFromString(categoryStr);
      const poiClosed = Boolean(poi.isClosed);

      // 再帰呼び出しで通常のgetMarkerIcon関数に処理を委譲
      return getMarkerIcon(poiType, poiCategory, poiClosed);
    }

    // POIタイプとカテゴリが直接渡された場合
    const iconType = typeOrPoi;
    const iconBase = POI_TYPE_ICON_BASE[iconType] || POI_TYPE_ICON_BASE.other;

    // Google Maps Platform Icon APIのURL
    const url = `https://maps.google.com/mapfiles/ms/icons/${iconBase}-dot.png`;

    // 閉店している場合は色を薄くする
    const iconOpacity = isClosed ? 0.5 : 1.0;

    return {
      url,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
      opacity: iconOpacity,
    };
  } catch (error) {
    // エラーが発生した場合は構造化ログに記録し、デフォルトアイコンを返す
    logger.error('マーカーアイコン生成中にエラーが発生しました', {
      component: 'MarkerUtils',
      action: 'getMarkerIcon',
      error: error instanceof Error ? error.message : String(error),
      type: typeof typeOrPoi === 'object' ? typeOrPoi.type : typeOrPoi,
      category: typeof typeOrPoi === 'object' ? typeOrPoi.category : category,
    });

    // フォールバック: デフォルトのアイコンを返す
    return {
      url: 'https://maps.google.com/mapfiles/ms/icons/info-dot.png',
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
      opacity: 1.0,
    };
  }
}

/**
 * 文字列からPOITypeを取得するヘルパー関数
 *
 * @param typeStr POIタイプを表す文字列
 * @returns POIType列挙型の値
 */
function getPOITypeFromString(typeStr: string): POIType {
  // 型安全な方法でチェック
  const normalizedType = typeStr.toLowerCase();
  return normalizedType in POI_TYPE_ICON_BASE ? (normalizedType as POIType) : 'other';
}

/**
 * 文字列からPOICategoryを取得するヘルパー関数
 *
 * @param categoryStr カテゴリを表す文字列
 * @returns POICategory列挙型の値
 */
function getCategoryFromString(categoryStr: string): POICategory {
  // 型安全な方法でチェック
  const normalizedCategory = categoryStr.toLowerCase();
  return normalizedCategory in CATEGORY_COLORS
    ? (normalizedCategory as POICategory)
    : 'unspecified';
}

/**
 * カスタムSVGマーカーアイコンを生成
 * より細かいカスタマイズが必要な場合に使用
 *
 * @param type POIの種類
 * @param category POIのカテゴリ
 * @param isClosed 閉店しているかどうか
 * @returns SVGベースのマーカーアイコン設定
 */
export function getSvgMarkerIcon(
  type: POIType,
  category: POICategory,
  isClosed = false
): MarkerIconOptions {
  try {
    // パフォーマンスに影響するデバッグログは環境変数に基づいて制御
    if (ENV.env.isDev && ENV.logging.level === 'debug') {
      logger.debug('SVGマーカーアイコンの生成', {
        component: 'MarkerUtils',
        action: 'getSvgMarkerIcon',
        type,
        category,
        isClosed,
      });
    }

    // カテゴリに対応する色を取得
    const color = isClosed
      ? '#9E9E9E' // 閉店の場合はグレー
      : `#${CATEGORY_COLORS[category] || CATEGORY_COLORS.unspecified}`;

    // SVGのパス - マップマーカーの形状
    const svgPath =
      'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z';

    // SVGデータURI - ブラウザが直接読み込める形式
    const svgIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path d="${svgPath}" fill="${encodeURIComponent(color)}" /></svg>`;

    // 閉店している場合は半透明にする
    const iconOpacity = isClosed ? 0.5 : 1.0;

    return {
      url: svgIcon,
      scaledSize: new google.maps.Size(36, 36),
      anchor: new google.maps.Point(18, 36), // マーカーの先端が座標に合うように
      opacity: iconOpacity,
    };
  } catch (error) {
    // エラーが発生した場合は構造化ログに記録し、デフォルトアイコンを返す
    logger.error('SVGマーカーアイコン生成中にエラーが発生しました', {
      component: 'MarkerUtils',
      action: 'getSvgMarkerIcon',
      error: error instanceof Error ? error.message : String(error),
      type,
      category,
    });

    // フォールバック: デフォルトのアイコンを返す
    return {
      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
      opacity: 1.0,
    };
  }
}

/**
 * マーカーのラベル設定を生成
 *
 * @param label ラベルテキスト
 * @param category POIのカテゴリ
 * @returns マーカーラベル設定
 */
export function getMarkerLabel(label: string, _category: POICategory): google.maps.MarkerLabel {
  return {
    text: label,
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
  };
}

/**
 * POIの種類に基づいてデフォルトのフィルター表示状態を生成
 *
 * @returns デフォルトのマーカー表示状態
 */
export function getDefaultMarkerVisibility(): MarkerVisibility {
  return {
    restaurant: true,
    shop: true,
    attraction: true,
    toilet: false, // デフォルトでは公共トイレを非表示
    parking: false, // デフォルトでは駐車場を非表示
    other: true,
  };
}

/**
 * POIカテゴリに基づいてデフォルトのフィルター設定を生成
 *
 * @returns デフォルトのカテゴリフィルター設定
 */
export function getDefaultCategoryFilter(): Record<string, boolean> {
  return {
    japanese: true,
    western: true,
    other: true,
    fusion: true,
    retail: true,
    unspecified: true,
  };
}

/**
 * マーカーの境界から最適な地図ズームと中心位置を計算
 *
 * @param markers マーカーの配列
 * @param map Google Maps インスタンス
 */
export function fitMapToMarkers(markers: google.maps.Marker[], map: google.maps.Map): void {
  if (markers.length === 0) return;

  const bounds = new google.maps.LatLngBounds();

  markers.forEach(marker => {
    const position = marker.getPosition();
    if (position) {
      bounds.extend(position);
    }
  });

  // 境界に合わせて地図を調整
  map.fitBounds(bounds);

  // マーカーが1つだけの場合は適切なズームレベルを設定
  if (markers.length === 1) {
    const marker = markers[0];
    const position = marker?.getPosition();
    if (position) {
      map.setCenter(position);
      map.setZoom(15); // 単一マーカーの場合は近めのズーム
    }
  }
}

/**
 * POIデータから曜日ごとの営業時間情報を整形
 *
 * @param poi POI情報オブジェクト
 * @returns 整形された営業時間情報
 */
export function formatWeekdaySchedule(poi: PointOfInterest): {
  regularHours?: string;
  daysOff?: string;
  [key: string]: string | undefined;
} {
  try {
    // 結果オブジェクト
    const result: { [key: string]: string | undefined } = {};

    // 営業時間テキストがあればそのまま設定
    if (poi.営業時間) {
      result.regularHours = poi.営業時間;
    }

    // 各曜日の定休日情報を取得
    const daysOffList: string[] = [];

    // 型安全性を高めるために曜日と対応するプロパティ名を明示的にマッピング
    const weekdayMap: Array<{ day: string; key: keyof PointOfInterest }> = [
      { day: '月曜', key: '月曜定休日' },
      { day: '火曜', key: '火曜定休日' },
      { day: '水曜', key: '水曜定休日' },
      { day: '木曜', key: '木曜定休日' },
      { day: '金曜', key: '金曜定休日' },
      { day: '土曜', key: '土曜定休日' },
      { day: '日曜', key: '日曜定休日' },
      { day: '祝祭', key: '祝祭定休日' },
    ];

    // 型安全なアクセスで各曜日の定休日情報を処理
    weekdayMap.forEach(({ day, key }) => {
      const isDayOff = Boolean(poi[key]);

      // 定休日の場合はリストに追加
      if (isDayOff) {
        daysOffList.push(day);
      }

      // 各曜日のスケジュールをセット
      result[day] = isDayOff ? '定休日' : '営業';
    });

    // 定休日情報をまとめる
    if (daysOffList.length > 0) {
      result.daysOff = daysOffList.join('、');
    }

    return result;
  } catch (error) {
    // エラー発生時は構造化ログに記録し、空のオブジェクトを返す
    logger.error('営業時間情報の整形中にエラーが発生しました', {
      component: 'MarkerUtils',
      action: 'formatWeekdaySchedule',
      error: error instanceof Error ? error.message : String(error),
      poiId: poi.id,
    });

    // フォールバック: 最小限の情報を含むオブジェクトを返す
    return {
      regularHours: poi.営業時間 || '情報なし',
    };
  }
}

/**
 * 指定の座標が地図の表示範囲内にあるかを判定
 *
 * @param position 座標オブジェクト
 * @param map Google Mapsインスタンス
 * @param padding 境界からのパディング（オプション、ピクセル単位）
 * @returns 表示範囲内ならtrue、そうでなければfalse
 */
export function isInViewport(
  position: google.maps.LatLngLiteral | google.maps.LatLng,
  map: google.maps.Map,
  padding: number = 0
): boolean {
  try {
    // 地図の表示範囲を取得
    const bounds = map.getBounds();
    if (!bounds) return true; // 境界が取得できない場合は表示とみなす

    // 位置情報が有効かチェック
    const lat = position instanceof google.maps.LatLng ? position.lat() : position.lat;
    const lng = position instanceof google.maps.LatLng ? position.lng() : position.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      logger.warn('無効な位置情報', {
        component: 'MarkerUtils',
        action: 'isInViewport',
        position,
      });
      return false;
    }

    // パディングなしの場合は単純に境界チェック（高速）
    if (padding <= 0) {
      return bounds.contains(
        position instanceof google.maps.LatLng ? position : new google.maps.LatLng(lat, lng)
      );
    }

    // パフォーマンス最適化: パディング計算はキャッシュ可能
    // パディング計算は計算コストが高いため、必要な場合のみ実行
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // 現在の表示範囲のサイズを計算
    const latSpan = ne.lat() - sw.lat();
    const lngSpan = ne.lng() - sw.lng();

    // パディングをパーセンテージとして算出（最適化）
    // map要素のサイズを一度だけ取得
    const mapEl = document.getElementById('map');
    if (!mapEl) return true; // マップ要素がなければ表示とみなす（フォールバック）

    const mapWidth = mapEl.clientWidth || 1; // ゼロ除算防止
    const mapHeight = mapEl.clientHeight || 1; // ゼロ除算防止

    // パディング比率を一度だけ計算（パフォーマンス最適化）
    const latPaddingRatio = padding / mapHeight;
    const lngPaddingRatio = padding / mapWidth;

    // 実際のパディング量を計算
    const latPadding = latPaddingRatio * latSpan;
    const lngPadding = lngPaddingRatio * lngSpan;

    // 境界チェック（最適化）- 新しいLatLngBoundsオブジェクト作成を避ける
    const containsLat = lat >= sw.lat() - latPadding && lat <= ne.lat() + latPadding;
    const containsLng = lng >= sw.lng() - lngPadding && lng <= ne.lng() + lngPadding;

    return containsLat && containsLng;
  } catch (error) {
    logger.error('表示範囲の確認中にエラーが発生しました', {
      component: 'MarkerUtils',
      action: 'isInViewport',
      error: error instanceof Error ? error.message : String(error),
    });
    return true; // エラーの場合は表示とみなす（フォールバック）
  }
}
