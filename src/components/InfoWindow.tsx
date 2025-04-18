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
import type { PointOfInterest } from '@/types/poi';
import { ENV } from '@/utils/env/index';
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
 * エラー発生時に表示するコンポーネント
 */
const ErrorDisplay = ({
  error,
  poi,
  onClose,
}: {
  error: unknown;
  poi: PointOfInterest;
  onClose: (() => void) | undefined;
}) => {
  // ガイドラインに準拠したより詳細なエラーログ
  logger.error('情報ウィンドウのレンダリングでエラーが発生しました', {
    component: 'InfoWindow',
    action: 'render',
    entityId: poi.id,
    entityName: poi.name,
    errorType: error instanceof Error ? error.name : 'UnknownError',
    errorMessage: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

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
};

/**
 * 地図上のマーカーをクリックした際に表示される情報ウィンドウコンポーネント
 * POIの基本情報を表示し、詳細表示への導線を提供します
 */
const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onClose, onViewDetails }) => {
  // コンポーネントのマウント時にログを出力（環境に応じてログレベル調整）
  React.useEffect(() => {
    // 開発環境でのみ詳細ログを出力
    if (ENV.env.isDev) {
      logger.debug('情報ウィンドウを表示', {
        component: 'InfoWindow',
        action: 'display',
        entityId: poi.id,
        entityName: poi.name,
        category: poi.category,
      });
    }

    return () => {
      // 開発環境でのみ詳細ログを出力
      if (ENV.env.isDev) {
        logger.debug('情報ウィンドウを閉じました', {
          component: 'InfoWindow',
          action: 'close',
          entityId: poi.id,
          entityName: poi.name,
        });
      }
    };
  }, [poi.id, poi.name, poi.category]);

  // onCloseのコールバック最適化（依存配列の最小化）
  const handleClose = useCallback(() => {
    if (ENV.env.isDev) {
      logger.debug('閉じるボタンがクリックされました', {
        component: 'InfoWindow',
        action: 'button_click',
        entityId: poi.id,
        actionType: 'close',
      });
    }
    onClose?.();
  }, [onClose, poi.id]);

  // 詳細表示のコールバック最適化
  const handleViewDetails = useCallback(() => {
    if (!onViewDetails) return;

    if (ENV.env.isDev) {
      logger.debug('詳細表示ボタンがクリックされました', {
        component: 'InfoWindow',
        action: 'button_click',
        entityId: poi.id,
        actionType: 'view_details',
      });
    }
    onViewDetails(poi);
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
    return <ErrorDisplay error={error} poi={poi} onClose={onClose} />;
  }
};

// パフォーマンス最適化のためmemoを適用
export default React.memo(InfoWindow);
