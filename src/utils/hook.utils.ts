import React, { useMemo, useState, useCallback } from 'react';
import { formatErrorDetails, isRetryableError, getErrorSeverity } from './utils';
import type { AppError } from './types';

export function useErrorHandling(...errorSources: (AppError | null)[]) {
  const combinedError = useMemo<AppError | null>(() => {
    return errorSources.find((error) => error !== null) || null;
  }, [errorSources]);

  const errorMessage = useMemo(() => {
    return combinedError?.message || '';
  }, [combinedError]);

  const errorDetails = useMemo(() => {
    return formatErrorDetails(combinedError);
  }, [combinedError]);

  const isRetryable = useMemo(() => {
    return isRetryableError(combinedError);
  }, [combinedError]);

  const severity = useMemo(() => {
    return getErrorSeverity(combinedError);
  }, [combinedError]);

  const errorType = useMemo(() => {
    if (!combinedError) return null;

    const errorCode = combinedError.code?.toLowerCase() || '';
    if (errorCode.includes('map')) return 'map';
    if (errorCode.includes('data') || errorCode.includes('fetch')) return 'data';
    if (errorCode.includes('geo')) return 'geolocation';
    return combinedError.category?.toLowerCase() || 'unknown';
  }, [combinedError]);

  return {
    combinedError,
    errorMessage,
    errorDetails,
    isRetryable,
    severity,
    errorType,
  };
}

export function useErrorState() {
}

export function createErrorComponent(ErrorDisplayComponent: React.ComponentType<any>) {
}
