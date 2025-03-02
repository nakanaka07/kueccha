import { useState } from 'react';
import { INITIAL_VISIBILITY } from '../utils/constants';
import type { AreaType } from '../utils/types';

export const useAreaVisibility = () => {
  const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  return { areaVisibility, setAreaVisibility };
};
