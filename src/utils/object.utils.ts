/**
 * オブジェクト操作関連のユーティリティ関数
 *
 * オブジェクトの比較、マージ、変換、抽出など、
 * オブジェクト操作に関する便利な関数を提供します。
 */

// ============================================================================
// 基本オブジェクト操作
// ============================================================================

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
 * オブジェクトを凍結して不変にする（浅い凍結）
 *
 * @param obj 凍結するオブジェクト
 * @returns 凍結されたオブジェクト
 */
export function freeze<T extends object>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}

/**
 * オブジェクトを深く凍結して不変にする
 *
 * @param obj 凍結するオブジェクト
 * @returns 深く凍結されたオブジェクト
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  // プリミティブ型は凍結不要
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  // オブジェクトのプロパティを再帰的に凍結
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (value !== null && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });

  return Object.freeze(obj);
}

// ============================================================================
// オブジェクト比較
// ============================================================================

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

    return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]));
  }

  // プリミティブ型は通常の比較で十分
  return a === b;
}

/**
 * 浅い比較で2つのオブジェクトが等しいかチェックする
 *
 * @param a 比較するオブジェクト1
 * @param b 比較するオブジェクト2
 * @returns 浅い比較で等しい場合はtrue、そうでなければfalse
 */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;

  const keysA = Object.keys(a) as Array<keyof T>;
  const keysB = Object.keys(b) as Array<keyof T>;

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && a[key] === b[key]);
}

// ============================================================================
// オブジェクトの変換と抽出
// ============================================================================

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
 * オブジェクトのすべてのキーと値のペアに関数を適用する
 *
 * @param obj 変換するオブジェクト
 * @param fn 各キーと値に適用する関数
 * @returns 変換後の新しいオブジェクト
 */
export function mapObject<T, R>(obj: Record<string, T>, fn: (value: T, key: string) => R): Record<string, R> {
  if (!obj) return {};

  const result: Record<string, R> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = fn(obj[key], key);
    }
  }
  return result;
}

/**
 * オブジェクト構造を平坦化する
 * ネストされたオブジェクトのプロパティを、ドット表記のキーを使った単一レベルのオブジェクトに変換する
 *
 * @param obj 平坦化するオブジェクト
 * @param prefix 親キーのプレフィックス（内部使用）
 * @returns 平坦化された新しいオブジェクト
 * @example
 * flattenObject({ a: { b: 1, c: { d: 2 } } })
 * // => { 'a.b': 1, 'a.c.d': 2 }
 */
export function flattenObject(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const prefixedKey = prefix ? `${prefix}.${key}` : key;

      if (
        obj[key] !== null &&
        typeof obj[key] === 'object' &&
        !Array.isArray(obj[key]) &&
        Object.keys(obj[key]).length > 0
      ) {
        // オブジェクトの場合は再帰的に平坦化
        Object.assign(acc, flattenObject(obj[key], prefixedKey));
      } else {
        // プリミティブ値または空オブジェクト、配列の場合はそのまま追加
        acc[prefixedKey] = obj[key];
      }

      return acc;
    },
    {} as Record<string, any>,
  );
}

/**
 * 平坦化されたオブジェクトを元のネスト構造に戻す
 *
 * @param obj 平坦化されたオブジェクト
 * @returns 元のネスト構造に復元されたオブジェクト
 * @example
 * unflattenObject({ 'a.b': 1, 'a.c.d': 2 })
 * // => { a: { b: 1, c: { d: 2 } } }
 */
export function unflattenObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const keyParts = key.split('.');

      let current = result;
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      current[keyParts[keyParts.length - 1]] = value;
    }
  }

  return result;
}

// ============================================================================
// オブジェクトのマージと更新
// ============================================================================

/**
 * 複数のオブジェクトを浅くマージする
 *
 * @param objects マージするオブジェクトの配列
 * @returns マージされた新しいオブジェクト
 */
export function merge<T extends object>(...objects: T[]): T {
  return Object.assign({}, ...objects);
}

/**
 * オブジェクトを深くマージする
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
 * オブジェクトのプロパティを更新する
 *
 * @param obj 更新するオブジェクト
 * @param path 更新するプロパティのパス（ドット記法または配列）
 * @param value 設定する値
 * @returns 更新された新しいオブジェクト
 * @example
 * updateIn({ a: { b: { c: 1 } } }, 'a.b.c', 2) // => { a: { b: { c: 2 } } }
 * updateIn({ a: { b: { c: 1 } } }, ['a', 'b', 'c'], 2) // => { a: { b: { c: 2 } } }
 */
export function updateIn<T extends Record<string, any>, V>(obj: T, path: string | (string | number)[], value: V): T {
  if (!obj) return { ...obj } as T;

  const pathArray = Array.isArray(path) ? path : path.split('.');
  const result = deepClone(obj);
  let current = result;

  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    // 存在しないパスの場合、新しいオブジェクトを作成
    if (current[key] === undefined) {
      const nextKey = pathArray[i + 1];
      current[key] = typeof nextKey === 'number' || !isNaN(Number(nextKey)) ? [] : {};
    }
    current = current[key];
  }

  const lastKey = pathArray[pathArray.length - 1];
  current[lastKey] = value;

  return result;
}

// ============================================================================
// 安全なアクセスと値の取得
// ============================================================================

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
 * オブジェクトがパスを持っているかをチェックする
 *
 * @param obj チェックするオブジェクト
 * @param path チェックするプロパティのパス（ドット記法または配列）
 * @returns パスが存在する場合はtrue、そうでなければfalse
 */
export function hasPath(obj: Record<string, any> | null | undefined, path: string | (string | number)[]): boolean {
  if (obj == null) return false;

  const pathArray = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const key of pathArray) {
    if (current == null || typeof current !== 'object') {
      return false;
    }

    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      return false;
    }

    current = current[key];
  }

  return true;
}

// ============================================================================
// オブジェクトの検証と変換
// ============================================================================

/**
 * オブジェクトから条件に合うキーと値のペアだけを抽出する
 *
 * @param obj 元のオブジェクト
 * @param predicate フィルタリング関数
 * @returns フィルタリングされた新しいオブジェクト
 */
export function filterObject<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean,
): Record<string, T> {
  if (!obj) return {};

  return Object.entries(obj).reduce(
    (result, [key, value]) => {
      if (predicate(value, key)) {
        result[key] = value;
      }
      return result;
    },
    {} as Record<string, T>,
  );
}

/**
 * オブジェクトのキーをキャメルケースに変換する
 *
 * @param obj 変換するオブジェクト
 * @returns キーがキャメルケースに変換された新しいオブジェクト
 * @example
 * camelCaseKeys({ 'first_name': 'John', 'last_name': 'Doe' })
 * // => { firstName: 'John', lastName: 'Doe' }
 */
export function camelCaseKeys(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => camelCaseKeys(item));
  }

  return Object.entries(obj).reduce(
    (result, [key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = typeof value === 'object' && value !== null ? camelCaseKeys(value) : value;
      return result;
    },
    {} as Record<string, any>,
  );
}

/**
 * オブジェクトのキーをスネークケースに変換する
 *
 * @param obj 変換するオブジェクト
 * @returns キーがスネークケースに変換された新しいオブジェクト
 * @example
 * snakeCaseKeys({ firstName: 'John', lastName: 'Doe' })
 * // => { first_name: 'John', last_name: 'Doe' }
 */
export function snakeCaseKeys(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => snakeCaseKeys(item));
  }

  return Object.entries(obj).reduce(
    (result, [key, value]) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = typeof value === 'object' && value !== null ? snakeCaseKeys(value) : value;
      return result;
    },
    {} as Record<string, any>,
  );
}

/**
 * undefined値を持つプロパティを削除する
 *
 * @param obj クリーンアップするオブジェクト
 * @param deep trueの場合、ネストされたオブジェクトも再帰的に処理する
 * @returns undefinedプロパティが削除された新しいオブジェクト
 */
export function cleanUndefined<T extends object>(obj: T, deep: boolean = false): Partial<T> {
  if (!obj) return {};

  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, any>)[key];

      if (value !== undefined) {
        if (deep && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = cleanUndefined(value, deep);
        } else {
          result[key] = value;
        }
      }
    }
  }

  return result as Partial<T>;
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
