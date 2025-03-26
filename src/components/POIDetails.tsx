import { formatWeekdaySchedule } from '@utils/markerUtils';
import React, { useState } from 'react';

import { PointOfInterest } from '@/types/poi';
import '@/global.css';

interface POIDetailsProps {
  /**
   * 表示対象のPOI情報
   */
  poi: PointOfInterest;

  /**
   * 詳細画面を閉じるときのコールバック
   */
  onClose: () => void;
}

/**
 * POI詳細情報表示コンポーネント
 * 選択されたPOIの詳細情報を表示します
 */
const POIDetails: React.FC<POIDetailsProps> = ({ poi, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'hours' | 'map'>('info');

  // 営業曜日の配列
  const weekdays = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '祝祭'];

  // 営業時間の整形
  const formattedSchedule = formatWeekdaySchedule(poi);

  // 緯度経度の形式チェック（有効な数値かどうか）
  const hasValidCoordinates =
    typeof poi.lat === 'number' &&
    typeof poi.lng === 'number' &&
    !isNaN(poi.lat) &&
    !isNaN(poi.lng);

  // カテゴリー情報の処理を修正 - poi.categories を使用
  const categories = poi.categories || [];

  return (
    <div className='poi-details-container'>
      {/* ヘッダー部分 */}
      <div className='poi-details-header'>
        <h2 className='poi-name'>
          {poi.isClosed && <span className='closed-label'>閉店</span>}
          {poi.name}
        </h2>
        <button className='close-button' onClick={onClose} aria-label='閉じる'>
          ×
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className='poi-tabs'>
        <button
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          基本情報
        </button>
        <button
          className={`tab-button ${activeTab === 'hours' ? 'active' : ''}`}
          onClick={() => setActiveTab('hours')}
        >
          営業時間
        </button>
        <button
          className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          地図
        </button>
      </div>

      {/* 基本情報タブ */}
      {activeTab === 'info' && (
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

          {poi.関連情報 && poi.関連情報 !== '情報なし' && (
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
          )}

          {poi['Google マップで見る'] && poi['Google マップで見る'] !== '情報なし' && (
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
          )}
        </div>
      )}

      {/* 営業時間タブ */}
      {activeTab === 'hours' && (
        <div className='poi-tab-content'>
          {poi.営業時間 && poi.営業時間 !== '情報なし' ? (
            <div className='hours-container'>
              <div className='info-row'>
                <span className='info-label'>営業時間:</span>
                <span className='info-value'>{poi.営業時間}</span>
              </div>

              <div className='weekday-schedule'>
                {weekdays.map(day => {
                  // 型安全なキャストに修正
                  const closedKey = `${day}定休日` as keyof PointOfInterest;
                  const isClosed = poi[closedKey] as boolean | undefined;

                  return (
                    <div key={day} className={`weekday-row ${isClosed ? 'closed-day' : ''}`}>
                      <span className='weekday-name'>{day}:</span>
                      <span className='weekday-hours'>
                        {isClosed ? '定休日' : formattedSchedule[day] || '情報なし'}
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
          ) : (
            <div className='no-info-message'>営業時間情報は登録されていません</div>
          )}
        </div>
      )}

      {/* 地図タブ */}
      {activeTab === 'map' && (
        <div className='poi-tab-content map-container'>
          {hasValidCoordinates ? (
            <div className='map-frame'>
              <iframe
                title={`${poi.name}の地図`}
                width='100%'
                height='250'
                frameBorder='0'
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
      )}

      {/* フッター部分 */}
      <div className='poi-details-footer'>
        {poi.isClosed ? (
          <div className='closed-notice'>この施設は閉店/閉鎖しています</div>
        ) : (
          <div className='actions-container'>
            {hasValidCoordinates && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
                target='_blank'
                rel='noopener noreferrer'
                className='directions-button'
              >
                ここへの道順
              </a>
            )}
            {poi.問い合わせ && poi.問い合わせ !== '情報なし' && (
              <a href={`tel:${poi.問い合わせ}`} className='call-button'>
                電話をかける
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default POIDetails;
