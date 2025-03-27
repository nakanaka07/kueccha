import React, { useMemo } from 'react';

import { PointOfInterest } from '@/types/poi';
import { getCategoryClass } from '@/utils/categoryUtils';
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

// カテゴリとジャンルのセクション
export const CategorySection: React.FC<CategorySectionProps> = ({ poi }) => (
  <section className='info-section'>
    {poi.categories?.map((category, index) => (
      <span key={index} className={getCategoryClass(category)}>
        {category}
      </span>
    ))}
    {poi.genre && <p className='genre'>{poi.genre}</p>}
  </section>
);

// 住所と地区のセクション
export const AddressSection: React.FC<AddressSectionProps> = ({ poi }) => (
  <section className='info-section'>
    <h3 className='section-title'>
      <span className='icon-location' aria-hidden='true'>
        📍
      </span>
      所在地
    </h3>
    <address className='address'>
      {poi.address}
      {poi.district && <span className='district'>（{poi.district}地区）</span>}
    </address>
  </section>
);

// 営業情報のセクション
export const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({ poi }) => {
  const scheduleInfo = useMemo(() => formatWeekdaySchedule(poi), [poi]);

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

// 連絡先のセクション
export const ContactSection: React.FC<ContactSectionProps> = ({ poi }) => {
  if (!poi.問い合わせ) return null;

  return (
    <section className='info-section'>
      <h3 className='section-title'>
        <span className='icon-contact' aria-hidden='true'>
          📞
        </span>
        連絡先
      </h3>
      <p className='contact'>
        <a href={`tel:${poi.問い合わせ}`} className='phone-link'>
          {poi.問い合わせ}
        </a>
      </p>
    </section>
  );
};

// Google Mapsリンクのセクション
export const GoogleMapsSection: React.FC<GoogleMapsSectionProps> = ({ poi }) => {
  if (!poi['Google マップで見る']) return null;

  return (
    <section className='info-section'>
      <a
        href={poi['Google マップで見る']}
        target='_blank'
        rel='noopener noreferrer'
        className='google-maps-link'
        aria-label='Google マップで見る'
      >
        Google マップで見る
      </a>
    </section>
  );
};

// フッターセクション
export const FooterSection: React.FC<FooterSectionProps> = ({ poi, onViewDetails }) => {
  return (
    <footer className='info-window-footer'>
      <button
        className='details-button'
        onClick={() => onViewDetails(poi)}
        aria-label='詳細情報を見る'
        type='button'
      >
        詳細情報を見る
      </button>
    </footer>
  );
};