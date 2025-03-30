import React, { useMemo } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger, LogContext } from '@/utils/logger';
import { formatWeekdaySchedule } from '@/utils/markerUtils';

/**
 * 基本情報タブコンテンツ
 * POIの基本的な情報を表示するコンポーネント
 */
export const InfoTabContent: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  logger.debug('基本情報タブをレンダリング', { poiId: poi.id, name: poi.name });

  // カテゴリの安全な取得
  const categories = useMemo(() => poi.categories ?? [], [poi.categories]);

  return (
    <div className='poi-tab-content'>
      {poi.genre && (
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

      {poi.address && (
        <div className='info-row'>
          <span className='info-label'>住所:</span>
          <span className='info-value'>{poi.address}</span>
        </div>
      )}

      {poi.問い合わせ && poi.問い合わせ !== '情報なし' && (
        <div className='info-row'>
          <span className='info-label'>連絡先:</span>
          <span className='info-value'>
            <a href={`tel:${poi.問い合わせ}`}>{poi.問い合わせ}</a>
          </span>
        </div>
      )}

      {renderRelatedInfo(poi)}
      {renderGoogleMapsLink(poi)}
    </div>
  );
};

/**
 * 関連情報リンクの表示
 * POIの関連情報からリンクを抽出して表示するヘルパー関数
 */
const renderRelatedInfo = (poi: PointOfInterest) => {
  if (!poi.関連情報 || poi.関連情報 === '情報なし') return null;

  // リンク情報を分析してログに記録
  logger.debug('関連情報リンクを処理', {
    poiId: poi.id,
    name: poi.name,
    linksCount: poi.関連情報.split('\n').filter(link => link.startsWith('http')).length,
  });

  return (
    <div className='info-row'>
      <span className='info-label'>関連情報:</span>
      <div className='info-value links-container'>
        {poi.関連情報.split('\n').map((link, index) => {
          if (link.startsWith('http')) {
            // リンク種別を判定してラベルを設定
            const label = useLinkLabel(link);

            return (
              <a
                key={index}
                href={link}
                target='_blank'
                rel='noopener noreferrer'
                className='external-link'
              >
                {label}
              </a>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

/**
 * リンクURLからラベルを判定する関数
 */
const useLinkLabel = (url: string): string => {
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('facebook')) return 'Facebook';
  if (url.includes('twitter') || url.includes('x.com')) return 'X (Twitter)';
  if (url.includes('visitsado')) return '佐渡観光サイト';
  return '公式サイト';
};

/**
 * Googleマップリンクの表示
 * POIのGoogleマップ情報を表示するヘルパー関数
 */
const renderGoogleMapsLink = (poi: PointOfInterest) => {
  if (!poi['Google マップで見る'] || poi['Google マップで見る'] === '情報なし') return null;

  return (
    <div className='info-row'>
      <a
        href={poi['Google マップで見る']}
        target='_blank'
        rel='noopener noreferrer'
        className='google-maps-link'
      >
        Google マップで見る
      </a>
    </div>
  );
};

/**
 * 営業時間タブコンテンツ
 * POIの営業時間情報を表示するコンポーネント
 */
export const HoursTabContent: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  logger.debug('営業時間タブをレンダリング', { poiId: poi.id, name: poi.name });

  // 曜日リスト
  const weekdays = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '祝祭'];

  // スケジュールをメモ化
  const formattedSchedule = useMemo(() => {
    try {
      return formatWeekdaySchedule(poi);
    } catch (error) {
      logger.error(
        'スケジュールのフォーマットに失敗しました',
        error instanceof Error ? error : ({ message: String(error) } as LogContext)
      );
      return {}; // エラー時は空オブジェクトを返す
    }
  }, [poi]);

  // 営業時間情報がない場合のメッセージ表示
  if (!poi.営業時間 || poi.営業時間 === '情報なし') {
    return <div className='no-info-message'>営業時間情報は登録されていません</div>;
  }

  return (
    <div className='poi-tab-content'>
      <div className='hours-container'>
        <div className='info-row'>
          <span className='info-label'>営業時間:</span>
          <span className='info-value'>{poi.営業時間}</span>
        </div>

        <div className='weekday-schedule'>
          {weekdays.map(day => {
            const closedKey = `${day}定休日` as keyof PointOfInterest;
            const isClosed = poi[closedKey] as boolean | undefined;

            return (
              <div key={day} className={`weekday-row ${isClosed ? 'closed-day' : ''}`}>
                <span className='weekday-name'>{day}:</span>
                <span className='weekday-hours'>
                  {isClosed ? '定休日' : (formattedSchedule[day] ?? '情報なし')}
                </span>
              </div>
            );
          })}
        </div>

        {poi.定休日について && poi.定休日について !== '情報なし' && (
          <div className='info-row holiday-note'>
            <span className='info-label'>備考:</span>
            <span className='info-value'>{poi.定休日について}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 地図タブコンテンツ
 * POIの位置情報を地図で表示するコンポーネント
 */
export const MapTabContent: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  logger.debug('地図タブをレンダリング', {
    poiId: poi.id,
    name: poi.name,
    hasCoordinates: !!(typeof poi.lat === 'number' && typeof poi.lng === 'number'),
  });

  // 有効な座標かどうか確認
  const hasValidCoordinates = useMemo(() => {
    const isValid =
      typeof poi.lat === 'number' &&
      typeof poi.lng === 'number' &&
      !isNaN(poi.lat) &&
      !isNaN(poi.lng);

    if (!isValid) {
      logger.warn('無効な座標データ', { poiId: poi.id, lat: poi.lat, lng: poi.lng });
    }

    return isValid;
  }, [poi.id, poi.lat, poi.lng]);

  return (
    <div className='poi-tab-content map-container'>
      {hasValidCoordinates ? (
        <div className='map-frame'>
          <iframe
            title={`${poi.name}の地図`}
            className='map-iframe'
            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${poi.lat},${poi.lng}&zoom=16`}
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className='no-map-message'>地図情報が利用できません</div>
      )}

      {poi.address && (
        <div className='address-container'>
          <span className='address-label'>住所:</span>
          <span className='address-value'>{poi.address}</span>
        </div>
      )}
    </div>
  );
};
