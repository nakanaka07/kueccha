/**
 * Result型を扱うユーティリティ関数
 */
import type { Result, BaseResponseError } from '../types/base.types';

/**
 * Result型を扱うユーティリティ関数
 */
export const ResultUtils = {
  success<T>(data: T, metadata?: Record<string, unknown>): Result<T> {
    return { success: true, data, metadata };
  },

  fail<T, E = BaseResponseError>(error: E): Result<T, E> {
    return { success: false, error };
  },

  isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true;
  },

  unwrap<T, E>(result: Result<T, E>): T {
    if (!result.success) {
      throw new Error('Result is not successful');
    }
    return result.data;
  },
};
