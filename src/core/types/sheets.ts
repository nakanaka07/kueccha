import { Poi } from './poi';

/**
 * シートデータの取得状態を表す型
 */
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * シートから取得したPOIデータの型
 */
export type SheetData = Poi[];
