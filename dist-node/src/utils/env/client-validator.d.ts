/**
 * クライアント側で実行される環境変数検証
 * ブラウザ環境でも安全に動作するよう設計
 */
/**
 * クライアント側で必要な環境変数を検証する
 * @returns 検証結果（成功=true、失敗=false）
 */
export declare function validateClientEnv(): boolean;
