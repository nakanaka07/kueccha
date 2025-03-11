export function createError(
  category: keyof typeof ERROR_MESSAGES,
  type: string,
  details?: string,
  code?: string,
): AppError {
  const message =
    ERROR_MESSAGES[category]?.[type as keyof (typeof ERROR_MESSAGES)[typeof category]] || ERROR_MESSAGES.SYSTEM.UNKNOWN;
  const errorCode = code || `${category}_${type}`.toUpperCase();

  return {
    message,
    code: errorCode,
    details,
    category,
    severity: getErrorSeverity({ message, code: errorCode, details, category }),
  };
}

export function handleApiError(
  error: unknown,
  retryCount: number,
  maxRetries: number,
  retryDelay: number,
  entityName: string = 'データ',
): AppError {
  console.error(`${entityName}取得エラー:`, error);
}
export function handleGeolocationError(error: GeolocationPositionError | Error): GeolocationError {
}

export function isRetryableError(error: AppError | null): boolean {
}

export function getErrorSeverity(error: AppError | null): ErrorSeverity {
}
export function formatErrorDetails(error: AppError | null): string {
}
