import publicToiletIcon from '../../assets/images/icons/ano_icon01.png';
import recommendIcon from '../../assets/images/icons/ano_icon_recommend.png';
import ryotsuAikawaIcon from '../../assets/images/icons/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from '../../assets/images/icons/icon_map02.png';
import akadomariHamochiOgiIcon from '../../assets/images/icons/icon_map03.png';
import parkingIcon from '../../assets/images/icons/shi_icon01.png';
import snackIcon from '../../assets/images/icons/shi_icon02.png';
import currentLocationIcon from '../../assets/images/icons/shi_icon04.png';
import defaultIcon from '../../assets/images/logos/row2.png';

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
