import React, { useCallback } from 'react';

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
import { logger } from '@/utils/logger';
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
  // コンポーネントのマウント時にログを出力
  React.useEffect(() => {
    logger.debug('情報ウィンドウを表示', {
      component: 'InfoWindow',
      poiName: poi.name,
      poiId: poi.id,
    });

    return () => {
      logger.debug('情報ウィンドウを閉じました', {
        component: 'InfoWindow',
        poiName: poi.name,
        poiId: poi.id,
      });
    };
  }, [poi.id, poi.name]);

  // onCloseのコールバック最適化
  const handleClose = useCallback(() => {
    logger.debug('閉じるボタンがクリックされました', {
      component: 'InfoWindow',
      poiId: poi.id,
    });
    onClose?.();
  }, [onClose, poi.id]);

  // 詳細表示のコールバック最適化
  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      logger.debug('詳細表示ボタンがクリックされました', {
        component: 'InfoWindow',
        poiId: poi.id,
      });
      onViewDetails(poi);
    }
  }, [onViewDetails, poi]);

  // エラーバウンダリの代わりにtry-catchで例外処理
  try {
    return (
      <article
        className='info-window'
        role='dialog'
        aria-labelledby='info-window-title'
        aria-describedby='info-window-content'
      >
        <header className='info-window-header'>
          <h2 id='info-window-title' className='info-window-title'>
            {poi.name}
            <StatusBadge poi={poi} />
          </h2>
          {onClose && (
            <button
              className='close-button'
              onClick={handleClose}
              aria-label='閉じる'
              type='button'
            >
              ✕
            </button>
          )}
        </header>

        <div id='info-window-content' className='info-window-content'>
          <CategorySection poi={poi} />
          <AddressSection poi={poi} />
          <BusinessHoursSection poi={poi} />
          <ContactSection poi={poi} />
          <GoogleMapsSection poi={poi} />
        </div>

        {onViewDetails && <FooterSection poi={poi} onViewDetails={handleViewDetails} />}
      </article>
    );
  } catch (error) {
    // エラー発生時のフォールバックUI
    logger.error(
      '情報ウィンドウのレンダリングでエラーが発生しました',
      error instanceof Error ? error : new Error(String(error))
    );
    return (
      <div className='info-window-error' role='alert'>
        <h3>表示エラー</h3>
        <p>情報の表示中に問題が発生しました。</p>
        {onClose && (
          <button onClick={onClose} type='button'>
            閉じる
          </button>
        )}
      </div>
    );
  }
};

// パフォーマンス最適化のためmemoを適用
export default React.memo(InfoWindow);
