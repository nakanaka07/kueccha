import { ErrorInfo } from 'react';

export function sendErrorLog(error: Error, errorInfo: ErrorInfo) {
  // エラーログをサーバーに送信する処理を実装
  fetch('/api/logError', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      error: error.toString(),
      errorInfo,
    }),
  }).catch(console.error);
}
