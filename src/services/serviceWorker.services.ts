/**
 * サービスワーカー管理サービス
 * PWA機能のためのサービスワーカーの登録、更新、状態管理
 */

// サービスワーカー対応確認
const isSWSupported = 'serviceWorker' in navigator;

/**
 * サービスワーカーを登録
 */
export async function registerSW(): Promise<void> {
  if (!isSWSupported) {
    throw new Error('このブラウザはサービスワーカーに対応していません');
  }

  try {
    await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    console.info('🔧 サービスワーカーが登録されました');
  } catch (error) {
    console.error('サービスワーカーの登録に失敗しました:', error);
    throw error;
  }
}

/**
 * サービスワーカーを更新
 */
export async function updateSW(): Promise<void> {
  if (!isSWSupported) return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.info('🔄 サービスワーカーが更新されました');
  } catch (error) {
    console.error('サービスワーカーの更新に失敗しました:', error);
    throw error;
  }
}

/**
 * サービスワーカーの状態を確認
 */
export async function checkSWStatus(): Promise<ServiceWorkerRegistration | null> {
  if (!isSWSupported) return null;
  
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn('サービスワーカーの状態確認に失敗しました:', error);
    return null;
  }
}

// グローバル型定義の拡張
declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}

export default { registerSW, updateSW, checkSWStatus };