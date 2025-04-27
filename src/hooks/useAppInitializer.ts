import { useEffect, useMemo } from 'react';

// 各処理を担当する特化したカスタムフックをインポート
import { useCacheManager } from '@/hooks/useCacheManager';
import { useEnvValidator } from '@/hooks/useEnvValidator';
import { useLoggerConfig } from '@/hooks/useLoggerConfig';
import { logger } from '@/utils/logger';

/**
 * アプリケーション初期化の結果を表す型定義
 */
interface AppInitializerResult {
  /** 環境変数検証エラーがあれば、そのメッセージを返す */
  envError: string | null;
  /** 初期化プロセスが完了したかどうか */
  initialized: boolean;
}

/**
 * アプリケーションの初期化処理を統括するカスタムフック
 *
 * 単一責任の原則に基づいて以下の機能を統合：
 * - 環境変数の検証（useEnvValidator）
 * - ロガーの設定（useLoggerConfig）
 * - キャッシュ管理（useCacheManager）
 *
 * 初期化の順序：
 * 1. 環境変数の検証 - アプリ設定の基盤となるため最初に実行
 * 2. ロガー設定 - エラー記録に必要なため早期に初期化
 * 3. キャッシュ管理 - データ取得前に準備
 *
 * @returns {AppInitializerResult} 初期化結果と環境変数エラー情報
 */
export const useAppInitializer = (): AppInitializerResult => {
  // 1. 環境変数の検証 - 最初に実行して設定の妥当性を確認
  const { envError } = useEnvValidator();

  // 2. ロガー設定 - エラーログ記録のために必要
  useLoggerConfig();

  // 3. キャッシュ管理 - データ取得の最適化
  useCacheManager();

  // 初期化状態を管理（エラーがなければ初期化成功とみなす）
  const initialized = useMemo(() => !envError, [envError]);
  // アプリケーション初期化の全体ログを記録
  useEffect(() => {
    const appVersion = import.meta.env.VITE_APP_VERSION || '未設定';

    // 初期化開始のログ - エラー状態に関わらず記録
    logger.info('アプリケーション初期化プロセスを開始', {
      timestamp: new Date().toISOString(),
      component: 'AppInitializer',
      version: appVersion,
      environment: import.meta.env.MODE || '未設定',
    });

    // エラーがある場合は警告ログに記録
    if (envError) {
      logger.warn('アプリケーション初期化で環境変数エラーを検出', {
        component: 'AppInitializer',
        errorMessage: envError,
        timestamp: new Date().toISOString(),
      });
    }

    // クリーンアップ関数でアプリ初期化完了をログ
    return () => {
      logger.info('アプリケーション初期化完了', {
        component: 'AppInitializer',
        hasError: !!envError,
        initialized,
        timestamp: new Date().toISOString(),
      });
    };
  }, [envError, initialized]);

  // 型安全な結果オブジェクトを返す
  return {
    envError,
    initialized,
  };
};
