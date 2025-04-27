// filepath: c:\Users\int-x-survey\Desktop\kueccha\src\components\InfoWindow.tsx
import React, { useCallback, useMemo, useState } from 'react';

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
import { ENV } from '@/env/index';
import { logger, LogLevel } from '@/utils/logger';
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
 * エラー種類に応じた回復戦略を実装
 */
const ErrorDisplay = React.memo(
  ({
    error,
    poi,
    onClose,
    onRetry,
  }: {
    error: unknown;
    poi: PointOfInterest;
    onClose: (() => void) | undefined;
    onRetry?: (() => void) | undefined;
  }) => {
    // エラー種類の判定
    const errorType = useMemo(() => {
      if (error instanceof TypeError) return 'TypeError';
      if (error instanceof ReferenceError) return 'ReferenceError';
      if (error instanceof SyntaxError) return 'SyntaxError';
      if (error instanceof Error) return error.name;
      return 'UnknownError';
    }, [error]);

    // エラーメッセージの取得
    const errorMessage = useMemo(
      () => (error instanceof Error ? error.message : String(error)),
      [error]
    );

    // エラーの重大度判定（復旧可能かどうか）
    const isFatal = useMemo(() => {
      // 特定のエラーは復旧可能と判断
      if (errorType === 'TypeError' || errorType === 'NetworkError') {
        return false;
      }
      return true;
    }, [errorType]);

    // ガイドラインに準拠したより詳細なエラーログ（パフォーマンス計測付き）
    logger.measureTime(
      'エラー詳細の記録',
      () => {
        logger.error('情報ウィンドウのレンダリングでエラーが発生しました', {
          component: 'InfoWindow',
          action: 'render',
          entityId: poi.id,
          entityName: poi.name,
          errorType,
          errorMessage,
          severity: isFatal ? 'fatal' : 'recoverable',
          stack: error instanceof Error ? error.stack : undefined,
        });
      },
      LogLevel.ERROR
    );

    return (
      <div className='info-window-error' role='alert'>
        <h3>表示エラー</h3>
        <p>情報の表示中に問題が発生しました。</p>

        <div className='error-actions'>
          {!isFatal && onRetry && (
            <button onClick={onRetry} type='button' className='retry-button'>
              再試行
            </button>
          )}
          {onClose && (
            <button onClick={onClose} type='button'>
              閉じる
            </button>
          )}
        </div>
      </div>
    );
  }
);

/**
 * 情報ウィンドウのヘッダー部分
 * タイトル表示とクローズボタンを担当
 */
const InfoWindowHeader = React.memo(
  ({ title, poi, onClose }: { title: string; poi: PointOfInterest; onClose?: () => void }) => {
    return (
      <header className='info-window-header'>
        <h2 id='info-window-title' className='info-window-title'>
          {title}
          <StatusBadge poi={poi} />
        </h2>
        {onClose && (
          <button className='close-button' onClick={onClose} aria-label='閉じる' type='button'>
            ✕
          </button>
        )}
      </header>
    );
  }
);

/**
 * 情報ウィンドウのコンテンツセクション
 */
const InfoWindowContent = React.memo(({ poi }: { poi: PointOfInterest }) => {
  return (
    <div id='info-window-content' className='info-window-content'>
      <CategorySection poi={poi} />
      <AddressSection poi={poi} />
      <BusinessHoursSection poi={poi} />
      <ContactSection poi={poi} />
      <GoogleMapsSection poi={poi} />
    </div>
  );
});

/**
 * 情報ウィンドウのフッターセクション
 * 詳細表示ボタンなどのアクションを含む
 */
const InfoWindowFooter = React.memo(
  ({
    poi,
    onViewDetails,
  }: {
    poi: PointOfInterest;
    onViewDetails: (poi: PointOfInterest) => void;
  }) => {
    return <FooterSection poi={poi} onViewDetails={onViewDetails} />;
  }
);

/**
 * 地図上のマーカーをクリックした際に表示される情報ウィンドウコンポーネント
 * POIの基本情報を表示し、詳細表示への導線を提供します
 */
const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onClose, onViewDetails }) => {
  // POIの重要な識別情報をメモ化（依存関係の減少）
  const poiIdentifier = useMemo(
    () => ({
      id: poi.id,
      name: poi.name,
      category: poi.category,
    }),
    [poi.id, poi.name, poi.category]
  );

  // コンポーネントのマウント時にパフォーマンス計測とともにログを出力
  React.useEffect(() => {
    // 開発環境でのみ詳細ログを出力
    if (ENV.env.isDev) {
      logger.debug('情報ウィンドウを表示', {
        component: 'InfoWindow',
        action: 'display',
        ...poiIdentifier,
      });
    }

    return () => {
      // 開発環境でのみ詳細ログを出力
      if (ENV.env.isDev) {
        logger.debug('情報ウィンドウを閉じました', {
          component: 'InfoWindow',
          action: 'close',
          id: poiIdentifier.id,
          name: poiIdentifier.name,
        });
      }
    };
  }, [poiIdentifier]);

  // onCloseのコールバック最適化（依存配列の最小化）
  const handleClose = useCallback(() => {
    // パフォーマンス計測を追加
    logger.measureTime(
      '閉じるボタンクリック処理',
      () => {
        if (ENV.env.isDev) {
          logger.debug('閉じるボタンがクリックされました', {
            component: 'InfoWindow',
            action: 'button_click',
            entityId: poiIdentifier.id,
            actionType: 'close',
          });
        }
        onClose?.();
      },
      LogLevel.DEBUG
    );
  }, [onClose, poiIdentifier.id]);

  // 詳細表示のコールバック最適化
  const handleViewDetails = useCallback(() => {
    if (!onViewDetails) return;

    // パフォーマンス計測を追加
    logger.measureTime(
      '詳細表示ボタンクリック処理',
      () => {
        if (ENV.env.isDev) {
          logger.debug('詳細表示ボタンがクリックされました', {
            component: 'InfoWindow',
            action: 'button_click',
            entityId: poiIdentifier.id,
            actionType: 'view_details',
          });
        }
        onViewDetails(poi);
      },
      LogLevel.DEBUG
    );
  }, [onViewDetails, poi, poiIdentifier.id]);

  // 再試行のための状態管理
  const [errorState, setErrorState] = useState<{
    hasError: boolean;
    error: unknown;
    retryCount: number;
  }>({
    hasError: false,
    error: null,
    retryCount: 0,
  });

  // エラーからの回復を試みる関数
  const handleRetry = useCallback(() => {
    // リトライ回数を増やして再レンダリングを試みる
    setErrorState(prev => ({
      ...prev,
      hasError: false,
      retryCount: prev.retryCount + 1,
    }));

    // 開発環境ではリトライログを出力
    if (ENV.env.isDev) {
      logger.info('情報ウィンドウの再表示を試みています', {
        component: 'InfoWindow',
        action: 'retry',
        entityId: poiIdentifier.id,
        retryCount: errorState.retryCount + 1,
      });
    }
  }, [poiIdentifier.id, errorState.retryCount]);

  // レンダリングの試行
  try {
    // エラー状態の場合はエラー表示を優先
    if (errorState.hasError) {
      return (
        <ErrorDisplay
          error={errorState.error}
          poi={poi}
          onClose={onClose}
          onRetry={errorState.retryCount < 3 ? handleRetry : undefined}
        />
      );
    }

    // レンダリング時間を計測
    return logger.measureTime(
      'InfoWindow レンダリング',
      () => {
        return (
          <article
            className='info-window'
            role='dialog'
            aria-labelledby='info-window-title'
            aria-describedby='info-window-content'
          >
            <InfoWindowHeader title={poi.name} poi={poi} onClose={handleClose} />
            <InfoWindowContent poi={poi} />
            {onViewDetails && <InfoWindowFooter poi={poi} onViewDetails={handleViewDetails} />}
          </article>
        );
      },
      LogLevel.DEBUG
    );
  } catch (error) {
    // エラー状態を更新
    if (!errorState.hasError) {
      setErrorState({
        hasError: true,
        error,
        retryCount: errorState.retryCount,
      });
    }

    // 即時のフォールバック表示
    return (
      <ErrorDisplay
        error={error}
        poi={poi}
        onClose={onClose}
        onRetry={errorState.retryCount < 3 ? handleRetry : undefined}
      />
    );
  }
};

// パフォーマンス最適化のためmemoを適用
export default React.memo(InfoWindow);
