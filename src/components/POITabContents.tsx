import React from 'react';

import { PointOfInterest } from '@/types/poi';
import { formatWeekdaySchedule } from '@/utils/markerUtils';

/**
 * 基本情報タブコンテンツ
 */
export const InfoTabContent: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  const categories = poi.categories ?? [];

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
 */
const renderRelatedInfo = (poi: PointOfInterest) => {
  if (!poi.関連情報 || poi.関連情報 === '情報なし') return null;

  return (
    <div className='info-row'>
      <span className='info-label'>関連情報:</span>
      <div className='info-value links-container'>
        {poi.関連情報.split('\n').map((link, index) => {
          if (link.startsWith('http')) {
            const label = link.includes('instagram')
              ? 'Instagram'
              : link.includes('facebook')
                ? 'Facebook'
                : link.includes('visitsado')
                  ? '佐渡観光サイト'
                  : '公式サイト';

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
 * Googleマップリンクの表示
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
 */
export const HoursTabContent: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  const weekdays = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '祝祭'];
  const formattedSchedule = formatWeekdaySchedule(poi);

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
 */
export const MapTabContent: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  const hasValidCoordinates =
    typeof poi.lat === 'number' &&
    typeof poi.lng === 'number' &&
    !isNaN(poi.lat) &&
    !isNaN(poi.lng);

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
