import { mapsConfig, markerConfig } from './maps';
import { sheetsConfig } from './sheets';
import { validateConfig, logConfigInDevelopment } from './validation';
import type { Config } from './types';

export { type Config } from './types';

// CONFIGオブジェクトの定義
export const CONFIG: Config = {
  maps: mapsConfig,
  sheets: sheetsConfig,
  markers: markerConfig,
};

// 設定の検証と開発環境でのログ出力
validateConfig(CONFIG);
logConfigInDevelopment(CONFIG);

export default CONFIG;
