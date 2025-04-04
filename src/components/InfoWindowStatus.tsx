import React, { useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';
import { ENV } from '@/utils/env';

// 曜日名の定数配列（コンポーネント外部で定義し、再レンダリング時の再生成を防止）
const DAY_NAMES = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'] as const;

// 営業状態の種類を型として定義
type BusinessStatus = 'closed' | 'day-off' | 'open';

// 型付きのステータス設定をコンポーネント外に定義して再レンダリングを防止
const STATUS_CONFIG: Record<BusinessStatus, { text: string; label: string; className: string }> = {
  closed: { text: '閉店', label: '閉店しています', className: 'closed' },
  'day-off': { text: '本日定休日', label: '本日は定休日です', className: 'day-off' },
  open: { text: '営業中', label: '現在営業中です', className: 'open' },
};

/**
 * 営業状況を表示するバッジコンポーネント
 * POIの営業状態を「閉店」「本日定休日」「営業中」のいずれかで表示します
 */
const InfoWindowStatus: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  // 営業状態の計算をメモ化して不要な再計算を防止
  const status = useMemo(() => {
    // 開発環境でのみ詳細ログを出力（ガイドラインに準拠）
    if (ENV.env.isDev) {
      logger.debug('営業状態の計算', {
        component: 'InfoWindowStatus',
        action: 'calculate_status',
        entityId: poi.id,
        entityName: poi.name,
      });
    }

    // 閉店している場合
    if (poi.isClosed) {
      logger.debug('POIは閉店しています', {
        component: 'InfoWindowStatus',
        action: 'status_check',
        entityId: poi.id,
      });
      return 'closed' as const;
    }

    // 現在の曜日が定休日かどうかチェック
    const now = new Date();
    const day = now.getDay(); // 0: 日曜, 1: 月曜, ...
    const dayName = DAY_NAMES[day];
    const dayOffKey = `${dayName}定休日` as keyof PointOfInterest;
    const isDayOff = poi[dayOffKey] === true;

    // 定休日の場合
    if (isDayOff) {
      logger.info('定休日のPOIへのアクセス', {
        component: 'InfoWindowStatus',
        action: 'day_off_access',
        entityId: poi.id,
        dayName,
      });
      return 'day-off' as const;
    }

    // 上記以外は営業中
    return 'open' as const;
  }, [
    poi.id,
    poi.isClosed,
    poi.日曜定休日,
    poi.月曜定休日,
    poi.火曜定休日,
    poi.水曜定休日,
    poi.木曜定休日,
    poi.金曜定休日,
    poi.土曜定休日,
  ]); // 依存配列を最適化: poiオブジェクト全体ではなく必要なプロパティのみを指定

  // 現在のステータスに対応する設定を取得
  const currentConfig = STATUS_CONFIG[status];

  // ステータスに応じたバッジを表示
  return (
    <span className={`status-badge ${currentConfig.className}`} aria-label={currentConfig.label}>
      {currentConfig.text}
    </span>
  );
};

export default InfoWindowStatus;
