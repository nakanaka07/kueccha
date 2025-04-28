/**
 * 型安全なプロパティアクセス関数
 * Generic Object Injection Sink警告を解消するためのユーティリティ
 * @module safeUtils
 */
export function safeGetProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K
): T[K] | undefined {
  // 明示的なホワイトリスト方式
  const allowedKeys = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜', '祝祭'] as K[];
  if (!allowedKeys.includes(key)) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    // Reflect APIを使用してプロパティにアクセス
    return Reflect.get(obj, key);
  }

  return undefined;
}
