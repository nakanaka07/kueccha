import { AreaCategory } from '../types/areas.types';
import type {
  AreaType,
  RegionAreaType,
  FacilityAreaType,
  SpecialAreaType,
  AreaCategoryFilter,
  GetAreaCategoryFn,
} from '../types/areas.types';
import type { Poi } from '../types/poi.types';

const INITIALLY_HIDDEN_AREAS: readonly AreaType[] = [
  'SNACK',
  'PUBLIC_TOILET',
  'PARKING',
  'CURRENT_LOCATION',
] as const;

export const GEOGRAPHIC_AREAS: Record<RegionAreaType, string> = {
  RYOTSU_AIKAWA: '両津・相川地区',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
};

export const FACILITY_CATEGORIES: Record<FacilityAreaType | SpecialAreaType, string> = {
  SNACK: 'スナック',
  PUBLIC_TOILET: '公共トイレ',
  PARKING: '駐車場',
  RECOMMEND: 'おすすめ',
  CURRENT_LOCATION: '現在地',
};

export const SPECIAL_AREAS: Record<SpecialAreaType, string> = {
  RECOMMEND: FACILITY_CATEGORIES.RECOMMEND,
  CURRENT_LOCATION: FACILITY_CATEGORIES.CURRENT_LOCATION,
};

export const AREAS: Record<AreaType, string> = {
  ...GEOGRAPHIC_AREAS,
  ...FACILITY_CATEGORIES,
};

export const CURRENT_LOCATION_POI: Omit<Poi, 'location'> = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION',
  category: '現在地',
  genre: '現在地',
};

export const INITIAL_VISIBILITY = Object.fromEntries(
  (Object.keys(AREAS) as Array<AreaType>).map((area) => [
    area,
    !INITIALLY_HIDDEN_AREAS.includes(area),
  ]),
) as Record<AreaType, boolean>;

export const AreasUtil = {
  isInitiallyVisible(area: AreaType): boolean {
    return INITIAL_VISIBILITY[area];
  },

  isGeographicArea(area: AreaType): boolean {
    return area in GEOGRAPHIC_AREAS;
  },

  isFacilityCategory(area: AreaType): boolean {
    return area in FACILITY_CATEGORIES && !(area in SPECIAL_AREAS);
  },

  isSpecialArea(area: AreaType): boolean {
    return area in SPECIAL_AREAS;
  },

  getAreaName(area: AreaType): string {
    return AREAS[area];
  },

  getAreaCategory: ((areaId: AreaType): AreaCategory => {
    if (AreasUtil.isGeographicArea(areaId)) {
      return AreaCategory.REGION;
    } else if (AreasUtil.isFacilityCategory(areaId)) {
      return AreaCategory.FACILITY;
    } else {
      return AreaCategory.SPECIAL;
    }
  }) as GetAreaCategoryFn,

  getAreas(categoryFilter?: AreaCategoryFilter): AreaType[] {
    if (categoryFilter === 'region') {
      return Object.keys(GEOGRAPHIC_AREAS) as RegionAreaType[];
    } else if (categoryFilter === 'facility') {
      return Object.keys(FACILITY_CATEGORIES).filter(
        (area) => !AreasUtil.isSpecialArea(area as AreaType),
      ) as FacilityAreaType[];
    } else if (categoryFilter === 'special') {
      return Object.keys(SPECIAL_AREAS) as SpecialAreaType[];
    }
    return Object.keys(AREAS) as AreaType[];
  },

  getVisibilityWithOverrides(
    overrides: Partial<Record<AreaType, boolean>>,
  ): Record<AreaType, boolean> {
    return { ...INITIAL_VISIBILITY, ...overrides };
  },
};

export const getAreaCategory = AreasUtil.getAreaCategory;
