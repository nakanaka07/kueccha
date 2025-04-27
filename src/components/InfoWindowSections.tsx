import React, { useMemo, useCallback } from 'react';

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
  const hasCategories = !!poi.categories && poi.categories.length > 0;
  // ジャンル情報があるかどうか
  const hasGenre = poi.genre !== undefined && poi.genre !== '';

  return (
    <section className='info-section' aria-label='カテゴリー情報'>
      <div className='categories' role='group' aria-label='施設のカテゴリー'>
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
      </div>
      {hasGenre && <p className='genre'>{poi.genre}</p>}
    </section>
  );
};

/**
 * POIの住所情報を表示するコンポーネント
 *
 * @param poi - 表示対象のPointOfInterest
 */
export const AddressSection: React.FC<AddressSectionProps> = ({ poi }) => {
  // 地区情報があるかどうか
  const hasDistrict = poi.district !== undefined && poi.district !== '';

  return (
    <section className='info-section' aria-labelledby='address-title'>
      <h3 className='section-title' id='address-title'>
        <span className='icon-location' aria-hidden='true'>
          📍
        </span>
        所在地
      </h3>
      <address className='address'>
        {poi.address || '住所情報なし'}
        {hasDistrict && <span className='district'>（{poi.district}地区）</span>}
      </address>
    </section>
  );
};

/**
 * POIの営業時間情報を表示するコンポーネント
 * フォーマットされた営業時間を表示し、データがない場合はその旨を表示
 *
 * @param poi - 表示対象のPointOfInterest
 */
export const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({ poi }) => {
  const scheduleInfo = useMemo(() => {
    try {
      // パフォーマンス計測のスタート
      const startTime = performance.now();
      const result = formatWeekdaySchedule(poi);
      const duration = performance.now() - startTime;

      // 処理時間をログに記録
      logger.debug('営業時間情報のフォーマット完了', {
        component: 'BusinessHoursSection',
        poiId: poi.id,
        duration: `${duration.toFixed(2)}ms`,
      });

      return result;
    } catch (error) {
      logger.warn('営業時間情報のフォーマットに失敗しました', {
        component: 'BusinessHoursSection',
        action: 'formatSchedule',
        poiId: poi.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return { regularHours: undefined, daysOff: undefined };
    }
  }, [poi]);
  // 営業時間情報があるかどうか
  const hasBusinessHours =
    scheduleInfo.regularHours !== undefined && scheduleInfo.regularHours !== '';
  // 定休日情報があるかどうか
  const hasDaysOff = scheduleInfo.daysOff !== undefined && scheduleInfo.daysOff !== '';
  // 定休日についての特記事項があるかどうか
  const hasSpecialNote = poi.定休日について !== undefined && poi.定休日について !== '';

  return (
    <section className='info-section' aria-labelledby='business-hours-title'>
      <h3 className='section-title' id='business-hours-title'>
        <span className='icon-time' aria-hidden='true'>
          🕒
        </span>
        営業情報
      </h3>
      {hasBusinessHours ? (
        <div className='business-hours'>
          <p className='hours'>{scheduleInfo.regularHours}</p>
          {hasDaysOff && <p className='days-off'>定休日: {scheduleInfo.daysOff}</p>}
          {hasSpecialNote && <p className='special-note'>{poi.定休日について}</p>}
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
  // 問い合わせ情報があるかどうかを確認
  const hasContactInfo = poi.問い合わせ !== undefined && poi.問い合わせ !== '';

  // useCallbackでイベントハンドラをメモ化 - 条件分岐の前に定義
  const handlePhoneClick = useCallback(() => {
    if (poi.問い合わせ) {
      // イベントハンドラ内で安全チェック
      logger.info('電話番号がクリックされました', {
        component: 'ContactSection',
        action: 'phoneClick',
        poiId: poi.id,
        phoneNumber: poi.問い合わせ,
      });
    }
  }, [poi.id, poi.問い合わせ]);

  // 問い合わせ情報がない場合は何も表示しない
  if (!hasContactInfo) return null;

  return (
    <section className='info-section' aria-labelledby='contact-title'>
      <h3 className='section-title' id='contact-title'>
        <span className='icon-contact' aria-hidden='true'>
          📞
        </span>
        連絡先
      </h3>
      <p className='contact'>
        <a
          href={`tel:${poi.問い合わせ}`}
          className='phone-link'
          onClick={handlePhoneClick}
          aria-label={`電話をかける: ${poi.問い合わせ}`}
        >
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
  // Google Maps URLを変数に抽出
  const mapUrl = poi['Google マップで見る'];
  // マップURLが存在するかどうか
  const hasMapUrl = !!mapUrl;

  // useCallbackでイベントハンドラをメモ化 - 条件分岐の前に定義
  const handleGoogleMapsClick = useCallback(() => {
    if (mapUrl) {
      // イベントハンドラ内で安全チェック
      logger.info('Google Mapsリンクがクリックされました', {
        component: 'GoogleMapsSection',
        action: 'mapLinkClick',
        poiId: poi.id,
        mapUrl,
      });
    }
  }, [poi.id, mapUrl]);

  // Googleマップリンクがない場合は何も表示しない
  if (!hasMapUrl) return null;

  return (
    <section className='info-section' aria-label='Google Maps情報'>
      <a
        href={mapUrl}
        target='_blank'
        rel='noopener noreferrer'
        className='google-maps-link'
        aria-label='Google マップで詳細位置を確認'
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
  // useCallbackでイベントハンドラをメモ化
  const handleViewDetails = useCallback(() => {
    logger.info('詳細情報ボタンがクリックされました', {
      component: 'FooterSection',
      action: 'viewDetails',
      poiId: poi.id,
      poiName: poi.name,
    });
    onViewDetails(poi);
  }, [poi, onViewDetails]);

  return (
    <footer className='info-window-footer' role='contentinfo'>
      <button
        className='details-button'
        onClick={handleViewDetails}
        aria-label={`${poi.name}の詳細情報を見る`}
        type='button'
      >
        詳細情報を見る
      </button>
    </footer>
  );
};
