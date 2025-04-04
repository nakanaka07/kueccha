import React, { useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { getCategoryClass, isSupportedCategory } from '@/utils/categoryUtils';
import { logger } from '@/utils/logger';
import { formatWeekdaySchedule } from '@/utils/markerUtils';

interface CategorySectionProps {
  poi: PointOfInterest;
}

interface AddressSectionProps {
  poi: PointOfInterest;
}

interface BusinessHoursSectionProps {
  poi: PointOfInterest;
}

interface ContactSectionProps {
  poi: PointOfInterest;
}

interface GoogleMapsSectionProps {
  poi: PointOfInterest;
}

interface FooterSectionProps {
  poi: PointOfInterest;
  onViewDetails: (poi: PointOfInterest) => void;
}

/**
 * POIのカテゴリとジャンル情報を表示するコンポーネント
 *
 * @param poi - 表示対象のPointOfInterest
 */
export const CategorySection: React.FC<CategorySectionProps> = ({ poi }) => {
  // カテゴリが存在するかチェック
  const hasCategories = poi.categories && poi.categories.length > 0;

  return (
    <section className='info-section'>
      {hasCategories ? (
        poi.categories?.map((category, index) => {
          // サポートされているカテゴリのみgetCategoryClassを使用
          const categoryClass = isSupportedCategory(category)
            ? getCategoryClass(category)
            : 'category-badge category-other';

          return (
            <span key={index} className={categoryClass}>
              {category}
            </span>
          );
        })
      ) : (
        <span className='category-unknown'>未分類</span>
      )}
      {poi.genre && <p className='genre'>{poi.genre}</p>}
    </section>
  );
};

/**
 * POIの住所情報を表示するコンポーネント
 *
 * @param poi - 表示対象のPointOfInterest
 */
export const AddressSection: React.FC<AddressSectionProps> = ({ poi }) => (
  <section className='info-section'>
    <h3 className='section-title'>
      <span className='icon-location' aria-hidden='true'>
        📍
      </span>
      所在地
    </h3>
    <address className='address'>
      {poi.address || '住所情報なし'}
      {poi.district && <span className='district'>（{poi.district}地区）</span>}
    </address>
  </section>
);

/**
 * POIの営業時間情報を表示するコンポーネント
 * フォーマットされた営業時間を表示し、データがない場合はその旨を表示
 *
 * @param poi - 表示対象のPointOfInterest
 */
export const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({ poi }) => {
  const scheduleInfo = useMemo(() => {
    try {
      return formatWeekdaySchedule(poi);
    } catch (error) {
      logger.warn('営業時間情報のフォーマットに失敗しました', {
        component: 'BusinessHoursSection',
        action: 'formatSchedule',
        poiId: poi.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return { regularHours: null, daysOff: null };
    }
  }, [poi]);

  return (
    <section className='info-section'>
      <h3 className='section-title'>
        <span className='icon-time' aria-hidden='true'>
          🕒
        </span>
        営業情報
      </h3>
      {scheduleInfo.regularHours ? (
        <div className='business-hours'>
          <p className='hours'>{scheduleInfo.regularHours}</p>
          {scheduleInfo.daysOff && <p className='days-off'>定休日: {scheduleInfo.daysOff}</p>}
          {poi.定休日について && <p className='special-note'>{poi.定休日について}</p>}
        </div>
      ) : (
        <p className='no-info'>営業時間情報がありません</p>
      )}
    </section>
  );
};

/**
 * POIの連絡先情報を表示するコンポーネント
 * 連絡先がない場合は何も表示しない
 *
 * @param poi - 表示対象のPointOfInterest
 */
export const ContactSection: React.FC<ContactSectionProps> = ({ poi }) => {
  if (!poi.問い合わせ) return null;

  const handlePhoneClick = () => {
    logger.info('電話番号がクリックされました', {
      component: 'ContactSection',
      action: 'phoneClick',
      poiId: poi.id,
      phoneNumber: poi.問い合わせ,
    });
  };

  return (
    <section className='info-section'>
      <h3 className='section-title'>
        <span className='icon-contact' aria-hidden='true'>
          📞
        </span>
        連絡先
      </h3>
      <p className='contact'>
        <a href={`tel:${poi.問い合わせ}`} className='phone-link' onClick={handlePhoneClick}>
          {poi.問い合わせ}
        </a>
      </p>
    </section>
  );
};

/**
 * POIのGoogle Maps連携リンクを表示するコンポーネント
 * リンクがない場合は何も表示しない
 *
 * @param poi - 表示対象のPointOfInterest
 */
export const GoogleMapsSection: React.FC<GoogleMapsSectionProps> = ({ poi }) => {
  if (!poi['Google マップで見る']) return null;

  const handleGoogleMapsClick = () => {
    logger.info('Google Mapsリンクがクリックされました', {
      component: 'GoogleMapsSection',
      action: 'mapLinkClick',
      poiId: poi.id,
      mapUrl: poi['Google マップで見る'],
    });
  };

  return (
    <section className='info-section'>
      <a
        href={poi['Google マップで見る']}
        target='_blank'
        rel='noopener noreferrer'
        className='google-maps-link'
        aria-label='Google マップで見る'
        onClick={handleGoogleMapsClick}
      >
        Google マップで見る
      </a>
    </section>
  );
};

/**
 * 情報ウィンドウのフッターを表示するコンポーネント
 * 詳細情報を見るボタンを提供する
 *
 * @param poi - 表示対象のPointOfInterest
 * @param onViewDetails - 詳細表示時のコールバック関数
 */
export const FooterSection: React.FC<FooterSectionProps> = ({ poi, onViewDetails }) => {
  const handleViewDetails = () => {
    logger.info('詳細情報ボタンがクリックされました', {
      component: 'FooterSection',
      action: 'viewDetails',
      poiId: poi.id,
      poiName: poi.name,
    });
    onViewDetails(poi);
  };

  return (
    <footer className='info-window-footer'>
      <button
        className='details-button'
        onClick={handleViewDetails}
        aria-label='詳細情報を見る'
        type='button'
      >
        詳細情報を見る
      </button>
    </footer>
  );
};
