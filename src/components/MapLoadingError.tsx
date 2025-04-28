import MapIcon from '@mui/icons-material/Map';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, Typography, Box, Link } from '@mui/material';
import { useEffect, memo, useCallback } from 'react';

import { logger } from '@/utils/logger';

/**
 * MapLoadingErrorコンポーネントのプロパティ
 */
interface MapLoadingErrorProps {
  /** エラーメッセージまたはエラーオブジェクト */
  error: string | Error;
  /** リトライ処理のコールバック関数 */
  onRetry?: () => void;
  /** 代替手段の表示を制御 */
  showAlternatives?: boolean;
  /** 外部地図へのフォールバックURL */
  fallbackUrl?: string;
}

/**
 * エラーメッセージを取得する関数
 * @param error エラーメッセージまたはエラーオブジェクト
 * @returns フォーマット済みのエラーメッセージ文字列
 */
const getErrorMessage = (error: string | Error): string => {
  if (typeof error === 'string') return error;
  return error.message || '不明なエラーが発生しました';
};

/**
 * エラー情報をログに記録するカスタムフック
 * @param errorMessage エラーメッセージ
 * @param additionalInfo 追加情報（オプション）
 */
const useErrorLogger = (errorMessage: string, additionalInfo = {}): void => {
  useEffect(() => {
    logger.error('地図読み込みエラー', {
      component: 'MapLoadingError',
      errorMessage,
      ...additionalInfo,
    });
  }, [errorMessage, additionalInfo]);
};

/**
 * 再試行ボタンコンポーネント
 * 単一責任の原則に基づいた分離コンポーネント
 */
const RetryButton = memo(({ onRetry }: { onRetry: () => void }) => (
  <Button
    variant='contained'
    color='primary'
    startIcon={<RefreshIcon />}
    onClick={onRetry}
    sx={{ mb: 2 }}
    aria-label='地図を再読み込み'
  >
    再読み込み
  </Button>
));

RetryButton.displayName = 'RetryButton';

/**
 * 代替地図オプションコンポーネント
 * 単一責任の原則に基づいた分離コンポーネント
 */
const AlternativeOptions = memo(({ fallbackUrl }: { fallbackUrl: string }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant='body2' sx={{ mb: 1 }}>
      別の方法で地図を表示:
    </Typography>

    <Button
      variant='outlined'
      size='small'
      startIcon={<MapIcon />}
      component={Link}
      href={fallbackUrl}
      target='_blank'
      rel='noopener noreferrer'
      aria-label='Google Mapsで佐渡島を表示（新しいタブで開きます）'
    >
      Google Mapsで佐渡島を表示
    </Button>
  </Box>
));

AlternativeOptions.displayName = 'AlternativeOptions';

/**
 * Google Maps API読み込み失敗時のフォールバックコンポーネント
 * KISS原則に基づいてシンプル化されています
 */
export const MapLoadingError = memo<MapLoadingErrorProps>(
  ({
    error,
    onRetry,
    showAlternatives = true,
    fallbackUrl = 'https://www.google.com/maps/search/?api=1&query=佐渡島',
  }) => {
    const errorMessage = getErrorMessage(error);

    // エラーの詳細情報を収集
    const errorDetails = {
      errorType: error instanceof Error ? error.constructor.name : 'StringError',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };

    // カスタムフックを使用してエラーをログに記録
    useErrorLogger(errorMessage, errorDetails);

    // onRetryコールバックのメモ化
    const handleRetry = useCallback(() => {
      logger.info('地図の再読み込みを試行', {
        component: 'MapLoadingError',
        timestamp: new Date().toISOString(),
      });
      if (onRetry) onRetry();
    }, [onRetry]);

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
          height: '100%',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
        }}
        role='alert'
        aria-live='assertive'
      >
        <Typography variant='h5' component='h2' gutterBottom>
          地図の読み込みに失敗しました
        </Typography>

        <Typography variant='body1' color='error' sx={{ mb: 3 }}>
          {errorMessage}
        </Typography>

        {onRetry && <RetryButton onRetry={handleRetry} />}

        {showAlternatives && <AlternativeOptions fallbackUrl={fallbackUrl} />}
      </Box>
    );
  }
);

MapLoadingError.displayName = 'MapLoadingError';
