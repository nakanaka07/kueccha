import React from 'react';

import {
  CategorySection,
  AddressSection,
  BusinessHoursSection,
  ContactSection,
  GoogleMapsSection,
  FooterSection,
} from '@/components/InfoWindowSections';
import StatusBadge from '@/components/InfoWindowStatus';
import { PointOfInterest } from '@/types/poi';
import '@/global.css';

interface InfoWindowProps {
  /**
   * 表示対象のPOI情報
   */
  poi: PointOfInterest;

  /**
   * ウィンドウを閉じるときのコールバック
   */
  onClose?: () => void;

  /**
   * POI詳細表示画面を開くときのコールバック
   */
  onViewDetails?: (poi: PointOfInterest) => void;
}

/**
 * 地図上のマーカーをクリックした際に表示される情報ウィンドウコンポーネント
 * POIの基本情報を表示し、詳細表示への導線を提供します
 */
const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onClose, onViewDetails }) => {
  return (
    <article className='info-window' role='dialog' aria-labelledby='info-window-title'>
      <header className='info-window-header'>
        <h2 id='info-window-title' className='info-window-title'>
          {poi.name}
          <StatusBadge poi={poi} />
        </h2>
        {onClose && (
          <button className='close-button' onClick={onClose} aria-label='閉じる' type='button'>
            ✕
          </button>
        )}
      </header>

      <div className='info-window-content'>
        <CategorySection poi={poi} />
        <AddressSection poi={poi} />
        <BusinessHoursSection poi={poi} />
        <ContactSection poi={poi} />
        <GoogleMapsSection poi={poi} />
      </div>

      {/* 
        onViewDetailsがundefinedの場合はFooterSectionをレンダリングしない
        または、onViewDetailsが存在する場合のみFooterSectionをレンダリング
        これにより型エラーを回避
      */}
      {onViewDetails && <FooterSection poi={poi} onViewDetails={onViewDetails} />}
    </article>
  );
};

export default InfoWindow;
