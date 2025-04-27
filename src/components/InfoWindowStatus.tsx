// filepath: c:\Users\int-x-survey\Desktop\kueccha\src\components\InfoWindowStatus.tsx
import React, { useMemo, useCallback } from 'react';

import { LogLevel } from '@/types/logger'; // LogLevelをインポート
import type { PointOfInterest } from '@/types/poi';
import { ENV } from '@/env/index';
import { logger } from '@/utils/logger';
import { measureSyncPerformance, useWhyDidYouUpdate } from '@/utils/performance';

// 曜日名の定数配列（as constを使用して型を限定）
const DAY_NAMES = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'] as const;
// 型を実際に活用する
type DayNameTuple = typeof DAY_NAMES;
type DayName = DayNameTuple[number];

// 営業状態の種類を型として定義
const BUSINESS_STATUS = {
  CLOSED: 'closed',
  DAY_OFF: 'day-off',
  OPEN: 'open',
} as const;
type BusinessStatus = (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

// 型付きのステータス設定（オブジェクトリテラル型として定義）
const STATUS_CONFIG: Record<BusinessStatus, { text: string; label: string; className: string }> = {
  [BUSINESS_STATUS.CLOSED]: { text: '閉店', label: '閉店しています', className: 'closed' },
  [BUSINESS_STATUS.DAY_OFF]: {
    text: '本日定休日',
    label: '本日は定休日です',
    className: 'day-off',
  },
  [BUSINESS_STATUS.OPEN]: { text: '営業中', label: '現在営業中です', className: 'open' },
};

// 安全な曜日名取得関数
const getDayName = (dayIndex: number): DayName | null => {
  if (dayIndex >= 0 && dayIndex < DAY_NAMES.length) {
    // 動的インデックスを使わずに、型安全な方法で値を取得
    return DAY_NAMES.at(dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6) ?? null;
  }
  return null;
};

/**
 * 営業状況を表示するバッジコンポーネント
 * POIの営業状態を「閉店」「本日定休日」「営業中」のいずれかで表示します
 */
const InfoWindowStatus: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  // 開発環境でのみ追跡データをロギング（フックは常に呼び出される）
  const enableTracking = ENV.env.isDev;
  useWhyDidYouUpdate('InfoWindowStatus', { poi, enableTracking });

  // POIの定休日をチェックするヘルパー関数 (メモ化)
  const isClosedOnDay = useCallback((poi: PointOfInterest, dayIndex: number): boolean => {
    if (dayIndex < 0 || dayIndex > 6) {
      logger.warn('不正な曜日インデックス', {
        component: 'InfoWindowStatus',
        action: 'day_check',
        value: dayIndex,
      });
      return false;
    }

    // 安全な関数を使用して曜日名を取得
    const dayName = getDayName(dayIndex);
    if (!dayName) return false;

    // 型安全な方法で定休日をチェック
    switch (dayName) {
      case '日曜':
        return Boolean(poi.日曜定休日);
      case '月曜':
        return Boolean(poi.月曜定休日);
      case '火曜':
        return Boolean(poi.火曜定休日);
      case '水曜':
        return Boolean(poi.水曜定休日);
      case '木曜':
        return Boolean(poi.木曜定休日);
      case '金曜':
        return Boolean(poi.金曜定休日);
      case '土曜':
        return Boolean(poi.土曜定休日);
      default:
        return false;
    }
  }, []); // 依存配列は空でOK（内部で参照しているものは全て静的）

  // 安全なステータス設定取得関数 (メモ化)
  const getStatusConfig = useCallback((status: BusinessStatus) => {
    // 厳密な型チェックで安全なアクセスを保証
    switch (status) {
      case BUSINESS_STATUS.CLOSED:
        return STATUS_CONFIG[BUSINESS_STATUS.CLOSED];
      case BUSINESS_STATUS.DAY_OFF:
        return STATUS_CONFIG[BUSINESS_STATUS.DAY_OFF];
      case BUSINESS_STATUS.OPEN:
        return STATUS_CONFIG[BUSINESS_STATUS.OPEN];
      default:
        // 予期せぬ値の場合のフォールバック
        return STATUS_CONFIG[BUSINESS_STATUS.CLOSED];
    }
  }, []); // 依存配列は空でOK（STATUS_CONFIGは変更されない）

  // 営業状態の計算をメモ化して不要な再計算を防止
  const status = useMemo(() => {
    // パフォーマンス計測機能を追加
    return measureSyncPerformance(
      '営業状態計算',
      () => {
        // 開発環境でのみ詳細ログを出力
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
          return BUSINESS_STATUS.CLOSED;
        }

        // 現在の曜日が定休日かどうかチェック
        const now = new Date();
        const day = now.getDay(); // 0: 日曜, 1: 月曜, ...

        // 型安全な定休日チェック関数を使用
        if (isClosedOnDay(poi, day)) {
          // 安全な関数を使用して曜日名を取得
          const dayName = getDayName(day);
          logger.info('定休日のPOIへのアクセス', {
            component: 'InfoWindowStatus',
            action: 'day_off_access',
            entityId: poi.id,
            dayName: dayName || '不明',
          });
          return BUSINESS_STATUS.DAY_OFF;
        }

        // 上記以外は営業中
        return BUSINESS_STATUS.OPEN;
      },
      LogLevel.DEBUG, // ここを修正：正しくLogLevelを第3引数として指定
      { entityId: poi.id } // 第4引数として追加コンテキストを指定
    );
  }, [poi, isClosedOnDay]); // 依存配列にisClosedOnDay関数を追加

  // 型安全性を確保しながら設定を取得
  const currentConfig = getStatusConfig(status);

  // ステータスに応じたバッジを表示
  return (
    <span className={`status-badge ${currentConfig.className}`} aria-label={currentConfig.label}>
      {currentConfig.text}
    </span>
  );
};

export default React.memo(InfoWindowStatus);
