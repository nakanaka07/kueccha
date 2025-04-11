import MapIcon from '@mui/icons-material/Map';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button, Typography, Box, Link } from '@mui/material';
import React, { useEffect } from 'react';

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
 */
const getErrorMessage = (error: string | Error): string => {
  if (typeof error === 'string') return error;
  return error.message || '不明なエラーが発生しました';
};

/**
 * Google Maps API読み込み失敗時のフォールバックコンポーネント
 * KISS原則に基づいてシンプル化されています
 */
export const MapLoadingError: React.FC<MapLoadingErrorProps> = ({
  error,
  onRetry,
  showAlternatives = true,
  fallbackUrl = 'https://www.google.com/maps/search/?api=1&query=佐渡島',
}) => {
  const errorMessage = getErrorMessage(error);

  // エラー発生時にログを記録
  useEffect(() => {
    logger.error('地図読み込みエラー', {
      component: 'MapLoadingError',
      errorMessage,
    });
  }, [errorMessage]);

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
    >
      <Typography variant='h5' component='h2' gutterBottom>
        地図の読み込みに失敗しました
      </Typography>

      <Typography variant='body1' color='error' sx={{ mb: 3 }}>
        {errorMessage}
      </Typography>

      {onRetry && (
        <Button
          variant='contained'
          color='primary'
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mb: 2 }}
        >
          再読み込み
        </Button>
      )}

      {showAlternatives && (
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
          >
            Google Mapsで佐渡島を表示
          </Button>
        </Box>
      )}
    </Box>
  );
};
