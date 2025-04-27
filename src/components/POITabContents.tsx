import React, { useMemo, useCallback, useEffect } from 'react';

import { ENV } from '@/env';
import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';
import { formatWeekdaySchedule } from '@/utils/markerUtils';

/**
 * 型安全なプロパティアクセス関数
 * Generic Object Injection Sink警告を解消するためのユーティリティ
 */
function safeGetProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] | undefined {
  // 明示的なホワイトリスト方式
  const allowedKeys = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '祝祭'] as K[];
  if (!allowedKeys.includes(key)) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    // Reflect APIを使用してプロパティにアクセス
    return Reflect.get(obj, key);
  }
  return undefined;
}

// 曜日の型定義
type WeekdayType = '月曜' | '火曜' | '水曜' | '木曜' | '金曜' | '土曜' | '日曜' | '祝祭';

// スケジュール型の定義
type ScheduleType = {
  regularHours?: string;
  daysOff?: string;
  月曜?: string;
  火曜?: string;
  水曜?: string;
  木曜?: string;
  金曜?: string;
  土曜?: string;
  日曜?: string;
  祝祭?: string;
  [key: string]: string | undefined;
};

/**
 * パフォーマンス計測のためのカスタムフック
 */
const useComponentPerformance = (componentName: string, poiId: string) => {
  useEffect(() => {
    const renderStart = performance.now();

    return () => {
      const renderDuration = performance.now() - renderStart;
      // レンダリング時間が長い場合のみログ出力
      if (renderDuration > 10 && ENV.env.isDev) {
        logger.debug(`${componentName}のライフサイクル時間: ${renderDuration.toFixed(2)}ms`, {
          component: componentName,
          duration: renderDuration,
          action: 'component_lifecycle',
          poiId,
        });
      }
    };
  }, [componentName, poiId]);
};

/**
 * リンクURLからラベルを判定する関数
 * パターンマッチングを使用して効率的に判定
 */
const getLinkLabel = (url: string): string => {
  // 一般的なSNSとウェブサイトのパターン
  const linkPatterns = [
    { pattern: 'instagram', label: 'Instagram' },
    { pattern: 'facebook', label: 'Facebook' },
    { pattern: 'twitter', label: 'X (Twitter)' },
    { pattern: 'x.com', label: 'X (Twitter)' },
    { pattern: 'visitsado', label: '佐渡観光サイト' },
    // 他の一般的なSNSやサイトのパターンを追加可能
  ];

  // 最初にマッチしたパターンのラベルを返す
  for (const { pattern, label } of linkPatterns) {
    if (url.includes(pattern)) {
      return label;
    }
  }

  // どのパターンにもマッチしない場合は公式サイトとする
  return '公式サイト';
};

/**
 * 関連情報リンクコンポーネント
 * パフォーマンス最適化とメモ化のためにコンポーネント化
 */
const RelatedInfoLinks: React.FC<{ links: string[] }> = React.memo(({ links }) => {
  if (links.length === 0) return null;

  return (
    <div className='info-value links-container'>
      {links.map((link, index) => {
        const label = getLinkLabel(link);
        return (
          <a
            key={index}
            href={link}
            target='_blank'
            rel='noopener noreferrer'
            className='external-link'
            aria-label={`${label}を新しいウィンドウで開く`}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
});

RelatedInfoLinks.displayName = 'RelatedInfoLinks';

/**
 * 基本情報タブコンテンツ
 * POIの基本的な情報を表示するコンポーネント
 */
export const InfoTabContent: React.FC<{ poi: PointOfInterest }> = React.memo(({ poi }) => {
  // パフォーマンス計測
  useComponentPerformance('InfoTabContent', poi.id);

  // 開発環境でのみデバッグログ出力
  if (ENV.env.isDev) {
    logger.debug('基本情報タブをレンダリング', {
      component: 'InfoTabContent',
      action: 'render',
      poiId: poi.id,
      name: poi.name,
    });
  }

  // カテゴリの安全な取得とメモ化
  const categories = useMemo(() => poi.categories ?? [], [poi.categories]);

  // 関連情報リンクの抽出とメモ化
  const relatedInfoLinks = useMemo(() => {
    if (poi.関連情報 === undefined || poi.関連情報 === '' || poi.関連情報 === '情報なし') {
      return [];
    }
    return poi.関連情報.split('\n').filter(link => link.startsWith('http'));
  }, [poi.関連情報]);

  // Google Maps リンクの取得
  const googleMapsLink = poi['Google マップで見る'];

  // Googleマップリンクの有効性をメモ化
  const hasGoogleMapsLink = useMemo(() => {
    return Boolean(googleMapsLink && googleMapsLink !== '' && googleMapsLink !== '情報なし');
  }, [googleMapsLink]);

  return (
    <div className='poi-tab-content'>
      {poi.genre !== undefined && poi.genre !== '' && (
        <div className='info-row'>
          <span className='info-label'>ジャンル:</span>
          <span className='info-value'>{poi.genre}</span>
        </div>
      )}

      {categories.length > 0 && (
        <div className='info-row'>
          <span className='info-label'>カテゴリ:</span>
          <span className='info-value'>{categories.join(', ')}</span>
        </div>
      )}

      {poi.address !== '' && (
        <div className='info-row'>
          <span className='info-label'>住所:</span>
          <span className='info-value'>{poi.address}</span>
        </div>
      )}

      {poi.問い合わせ !== undefined && poi.問い合わせ !== '' && poi.問い合わせ !== '情報なし' && (
        <div className='info-row'>
          <span className='info-label'>連絡先:</span>
          <span className='info-value'>
            <a href={`tel:${poi.問い合わせ}`} aria-label={`${poi.問い合わせ}に電話をかける`}>
              {poi.問い合わせ}
            </a>
          </span>
        </div>
      )}

      {relatedInfoLinks.length > 0 && (
        <div className='info-row'>
          <span className='info-label'>関連情報:</span>
          <RelatedInfoLinks links={relatedInfoLinks} />
        </div>
      )}

      {hasGoogleMapsLink && (
        <div className='info-row'>
          <a
            href={googleMapsLink}
            target='_blank'
            rel='noopener noreferrer'
            className='google-maps-link'
            aria-label='Googleマップで施設位置を確認する（新しいウィンドウが開きます）'
          >
            Google マップで見る
          </a>
        </div>
      )}
    </div>
  );
});

InfoTabContent.displayName = 'InfoTabContent';

/**
 * 営業時間タブコンテンツ
 * POIの営業時間情報を表示するコンポーネント
 */
export const HoursTabContent: React.FC<{ poi: PointOfInterest }> = React.memo(({ poi }) => {
  // パフォーマンス計測
  useComponentPerformance('HoursTabContent', poi.id);

  // 開発環境でのみデバッグログ出力
  if (ENV.env.isDev) {
    logger.debug('営業時間タブをレンダリング', {
      component: 'HoursTabContent',
      action: 'render',
      poiId: poi.id,
      name: poi.name,
    });
  }

  // 曜日リスト
  const weekdays: WeekdayType[] = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '祝祭'];

  // スケジュールをメモ化（エラーハンドリングを強化）
  const formattedSchedule = useMemo<ScheduleType>(() => {
    try {
      return formatWeekdaySchedule(poi);
    } catch (error) {
      logger.error('スケジュールのフォーマットに失敗しました', {
        component: 'HoursTabContent',
        action: 'formatSchedule',
        poiId: poi.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {}; // エラー時は空オブジェクトを返す
    }
  }, [poi]);

  // 営業時間情報がない場合のメッセージ表示
  if (poi.営業時間 === undefined || poi.営業時間 === '' || poi.営業時間 === '情報なし') {
    logger.debug('営業時間情報なし', {
      component: 'HoursTabContent',
      action: 'checkHoursData',
      poiId: poi.id,
    });
    return (
      <div className='no-info-message' role='status' aria-live='polite'>
        営業時間情報は登録されていません
      </div>
    );
  }

  return (
    <div className='poi-tab-content'>
      <div className='hours-container'>
        <div className='info-row'>
          <span className='info-label'>営業時間:</span>
          <span className='info-value'>{poi.営業時間}</span>
        </div>

        <div className='weekday-schedule' role='table' aria-label='曜日別営業時間'>
          {weekdays.map(day => {
            const closedKey = `${day}定休日` as keyof PointOfInterest;
            // 安全なプロパティアクセス関数を使用して警告を解消
            const isClosed = safeGetProperty(poi, closedKey) as boolean | undefined;

            return (
              <div
                key={day}
                className={`weekday-row ${isClosed === true ? 'closed-day' : ''}`}
                role='row'
              >
                <span className='weekday-name' role='cell'>
                  {day}:
                </span>
                <span
                  className='weekday-hours'
                  role='cell'
                  aria-label={`${day}の営業時間: ${isClosed === true ? '定休日' : (formattedSchedule[day as WeekdayType] ?? '情報なし')}`}
                >
                  {isClosed === true
                    ? '定休日'
                    : (formattedSchedule[day as WeekdayType] ?? '情報なし')}
                </span>
              </div>
            );
          })}
        </div>

        {poi.定休日について !== undefined &&
          poi.定休日について !== '' &&
          poi.定休日について !== '情報なし' && (
            <div className='info-row holiday-note'>
              <span className='info-label'>備考:</span>
              <span className='info-value'>{poi.定休日について}</span>
            </div>
          )}
      </div>
    </div>
  );
});

HoursTabContent.displayName = 'HoursTabContent';

/**
 * 地図タブコンテンツ
 * POIの位置情報を地図で表示するコンポーネント
 */
export const MapTabContent: React.FC<{ poi: PointOfInterest }> = React.memo(({ poi }) => {
  // パフォーマンス計測
  useComponentPerformance('MapTabContent', poi.id);

  // 開発環境でのみデバッグログ出力
  if (ENV.env.isDev) {
    logger.debug('地図タブをレンダリング', {
      component: 'MapTabContent',
      action: 'render',
      poiId: poi.id,
      name: poi.name,
      hasCoordinates: !!(typeof poi.lat === 'number' && typeof poi.lng === 'number'),
    });
  }

  // 有効な座標かどうか確認（必要な依存配列のみに最適化）
  const hasValidCoordinates = useMemo(() => {
    const isValid =
      typeof poi.lat === 'number' &&
      typeof poi.lng === 'number' &&
      !isNaN(poi.lat) &&
      !isNaN(poi.lng);

    if (!isValid) {
      logger.warn('無効な座標データ', {
        component: 'MapTabContent',
        action: 'validateCoordinates',
        poiId: poi.id,
        lat: poi.lat,
        lng: poi.lng,
      });
    }

    return isValid;
  }, [poi.lat, poi.lng, poi.id]);

  // Google Maps APIキー取得（ENV経由でアクセス）
  const apiKey = useMemo(() => ENV.google.apiKey, []);

  // iframe読み込み開始・完了を追跡するハンドラー
  const handleIframeLoad = useCallback(() => {
    logger.debug('地図iframeの読み込み完了', {
      component: 'MapTabContent',
      action: 'iframe_loaded',
      poiId: poi.id,
    });
  }, [poi.id]);

  return (
    <div className='poi-tab-content map-container'>
      {hasValidCoordinates ? (
        <div className='map-frame'>
          <iframe
            title={`${poi.name}の地図`}
            className='map-iframe'
            src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${poi.lat},${poi.lng}&zoom=16&language=ja`}
            allowFullScreen
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            onLoad={handleIframeLoad}
            aria-label={`${poi.name}の位置を示すGoogleマップ`}
          ></iframe>
          <div className='map-controls' aria-hidden='true'>
            <small className='map-notice'>地図をタップして拡大・縮小できます</small>
          </div>
        </div>
      ) : (
        <div className='no-map-message' role='alert' aria-live='polite'>
          地図情報が利用できません
        </div>
      )}

      {poi.address !== '' && (
        <div className='address-container'>
          <span className='address-label'>住所:</span>
          <span className='address-value'>{poi.address}</span>
        </div>
      )}
    </div>
  );
});

MapTabContent.displayName = 'MapTabContent';
