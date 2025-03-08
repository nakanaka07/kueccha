/**
 * 機能: Google Maps用のマーカーアイコンと色の定義
 * 依存関係:
 *   - ../utils/imagesディレクトリ内の各種アイコン画像ファイル
 * 注意点:
 *   - アイコンファイルへのパスが正確であることを確認
 *   - const assertionを使用して型安全性を確保
 *   - MARKER_ICONSは直接アクセス用にMARKERS.iconsをエクスポート
 */
import publicToiletIcon from '../utils/images/ano_icon01.png';
import recommendIcon from '../utils/images/ano_icon_recommend.png';
import ryotsuAikawaIcon from '../utils/images/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from '../utils/images/icon_map02.png';
import akadomariHamochiOgiIcon from '../utils/images/icon_map03.png';
import defaultIcon from '../utils/images/row2.png';
import parkingIcon from '../utils/images/shi_icon01.png';
import snackIcon from '../utils/images/shi_icon02.png';
import currentLocationIcon from '../utils/images/shi_icon04.png';

export const MARKERS = {
  colors: {
    DEFAULT: '#000000',
    RYOTSU_AIKAWA: '#d9a62e',
    KANAI_SAWADA_NIIBO_HATANO_MANO: '#ec6800',
    AKADOMARI_HAMOCHI_OGI: '#007b43',
    SNACK: '#65318e',
    PUBLIC_TOILET: '#2792c3',
    PARKING: '#333333',
    RECOMMEND: '#d7003a',
    CURRENT_LOCATION: '#42a30f',
  },
  icons: {
    DEFAULT: defaultIcon,
    RYOTSU_AIKAWA: ryotsuAikawaIcon,
    KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
    AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
    SNACK: snackIcon,
    PUBLIC_TOILET: publicToiletIcon,
    PARKING: parkingIcon,
    RECOMMEND: recommendIcon,
    CURRENT_LOCATION: currentLocationIcon,
  },
} as const;

export const MARKER_ICONS = MARKERS.icons;
