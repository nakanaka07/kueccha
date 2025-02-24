import { AreaVisibility } from './types';

// updateRecommend 関数の定義
export const updateRecommend = (prev: AreaVisibility): AreaVisibility => ({
  ...prev,
  RECOMMEND: !prev.RECOMMEND,
});
