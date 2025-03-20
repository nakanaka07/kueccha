/**
 * オブジェクト操作関連のユーティリティ関数
 *
 * オブジェクトの比較、マージ、変換、抽出など、
 * オブジェクト操作に関する便利な関数を提供します。
 */

/**
 * オブジェクトが空かどうかをチェックする
 *
 * @param obj チェックするオブジェクト
 * @returns オブジェクトが空の場合はtrue、そうでなければfalse
 */
export function isEmpty(obj: Record<string, any> | null | undefined): boolean {
  if (obj == null) return true;
  return Object.keys(obj).length === 0;
}

/**
 * オブジェクトのディープコピーを作成する
 *
 * @param obj コピーするオブジェクト
 * @returns オブジェクトの新しいコピー
 */
export function deepClone<T>(obj: T): T {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const copy: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
      copy[key] = deepClone((obj as Record<string, any>)[key]);
    });
    return copy as T;
  }

  return obj;
}

/**
 * 2つの値が等しいかをディープ比較する
 *
 * @param a 比較する値1
 * @param b 比較する値2
 * @returns 2つの値が等しい場合はtrue、そうでなければfalse
 */
export function isEqual(a: any, b: any): boolean {
  // 参照が同じ場合は等しい
  if (a === b) return true;

  // どちらかがnullまたはundefinedの場合
  if (a == null || b == null) return a === b;

  // 型が異なる場合は等しくない
  if (typeof a !== typeof b) return false;

  // オブジェクトとしての比較
  if (typeof a === 'object') {
    // 配列の場合
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => isEqual(item, b[index]));
    }

    // Date型の場合
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // 正規表現の場合
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }

    // 通常のオブジェクトの場合
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(
      (key) => Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]),
    );
  }

  // プリミティブ型は通常の比較で十分
  return a === b;
}

/**
 * オブジェクトから特定のプロパティだけを抽出する
 *
 * @param obj 元のオブジェクト
 * @param keys 抽出するプロパティキーの配列
 * @returns 抽出されたプロパティを持つ新しいオブジェクト
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  if (!obj) return {} as Pick<T, K>;

  return keys.reduce(
    (result, key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = obj[key];
      }
      return result;
    },
    {} as Pick<T, K>,
  );
}

/**
 * オブジェクトから特定のプロパティを除外する
 *
 * @param obj 元のオブジェクト
 * @param keys 除外するプロパティキーの配列
 * @returns 指定されたプロパティが除外された新しいオブジェクト
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  if (!obj) return {} as Omit<T, K>;

  const result = { ...obj } as any;
  keys.forEach((key) => {
    delete result[key];
  });

  return result as Omit<T, K>;
}

/**
 * 複数のオブジェクトを深くマージする
 *
 * @param target ベースとなるオブジェクト
 * @param sources マージするオブジェクト
 * @returns 深くマージされた新しいオブジェクト
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;

  const result: Record<string, any> = { ...target };

  for (const source of sources) {
    if (!source) continue;

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const targetValue = result[key];
        const sourceValue = (source as Record<string, any>)[key];

        if (
          sourceValue !== null &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue !== null &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          // 両方がオブジェクトの場合、再帰的にマージ
          result[key] = deepMerge(targetValue, sourceValue);
        } else {
          // それ以外の場合は直接上書き
          result[key] = sourceValue !== undefined ? sourceValue : targetValue;
        }
      }
    }
  }

  return result as T;
}

/**
 * ネストされたオブジェクトから安全に値を取得する
 *
 * @param obj 対象のオブジェクト
 * @param path 取得するプロパティのパス（ドット記法または配列）
 * @param defaultValue 値が存在しない場合のデフォルト値
 * @returns 取得した値またはデフォルト値
 * @example
 * getIn({ a: { b: { c: 1 } } }, 'a.b.c') // => 1
 * getIn({ a: { b: { c: 1 } } }, ['a', 'b', 'c']) // => 1
 * getIn({ a: { b: { c: 1 } } }, 'a.x.c', 'default') // => 'default'
 */
export function getIn<T, D = undefined>(
  obj: Record<string, any> | null | undefined,
  path: string | (string | number)[],
  defaultValue?: D,
): T | D {
  if (obj == null) return defaultValue as D;

  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const key of pathArray) {
    if (current == null || typeof current !== 'object') {
      return defaultValue as D;
    }

    current = current[key];

    if (current === undefined) {
      return defaultValue as D;
    }
  }

  return current as T;
}

/**
 * nullとundefinedの値を持つプロパティを削除する
 *
 * @param obj クリーンアップするオブジェクト
 * @param deep trueの場合、ネストされたオブジェクトも再帰的に処理する
 * @returns nullとundefinedプロパティが削除された新しいオブジェクト
 */
export function cleanNullish<T extends object>(obj: T, deep: boolean = false): Partial<T> {
  if (!obj) return {};

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, any>)[key];

      if (value != null) {
        if (deep && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = cleanNullish(value, deep);
        } else {
          result[key] = value;
        }
      }
    }
  }

  return result as Partial<T>;
}