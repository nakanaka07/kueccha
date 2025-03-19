/**
 * サービスワーカー管理サービス
 *
 * PWA機能のためのサービスワーカーの登録、更新、状態管理を担当します。
 */

/**
 * サービスワーカーを登録する関数
 *
 * @returns 登録が成功した場合はPromise<void>
 */
export async function registerSW(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      // サービスワーカーを登録
      await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.info('🔧 サービスワーカーが登録されました');
    } catch (error) {
      console.error('サービスワーカーの登録に失敗しました:', error);
      throw error;
    }
  } else {
    throw new Error('このブラウザはサービスワーカーに対応していません');
  }
}

/**
 * サービスワーカーを更新する関数
 *
 * @returns 更新が成功した場合はPromise<void>
 */
export async function updateSW(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      console.info('🔄 サービスワーカーが更新されました');
    } catch (error) {
      console.error('サービスワーカーの更新に失敗しました:', error);
      throw error;
    }
  }
}

/**
 * サービスワーカーの状態を確認する関数
 *
 * @returns サービスワーカーの登録情報、未登録の場合はnull
 */
export async function checkSWStatus(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      return await navigator.serviceWorker.ready;
    } catch (error) {
      console.warn('サービスワーカーの状態確認に失敗しました:', error);
      return null;
    }
  }
  return null;
}

// グローバル型定義の拡張
declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }

  // BeforeInstallPromptEventの型定義
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}
