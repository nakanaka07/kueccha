// @ts-check
/**
 * 環境変数検証スクリプト
 *
 * 用途:
 * - 開発およびビルド前に環境変数の設定を検証
 * - 必要な環境変数が不足している場合にビルドを中断
 */

// @ts-ignore
import { fileURLToPath } from 'url';
// @ts-ignore
import { dirname, resolve } from 'path';
// @ts-ignore
import * as dotenv from 'dotenv';

// ESM環境でのファイルパス取得
// @ts-ignore import.meta型定義を無視
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// 環境変数の読み込み
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: resolve(rootDir, '.env') });
dotenv.config({ path: resolve(rootDir, envFile), override: true });
dotenv.config({ path: resolve(rootDir, `${envFile}.local`), override: true });

// できるだけランタイムにエラーを引き起こさないように、ここでは環境変数チェックのみ行う
try {
  console.log('🔍 環境変数の検証を開始します...');

  // 必須環境変数のチェック
  const requiredVars = ['VITE_GOOGLE_API_KEY', 'VITE_GOOGLE_SPREADSHEET_ID'];

  const missingVars = requiredVars.filter(varName => {
    return !process.env[varName];
  });

  if (missingVars.length > 0) {
    console.error('❌ 以下の必須環境変数が設定されていません:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n⚠️ .env ファイルを確認し、必要な環境変数を設定してください。');
    console.error('   サンプルとして .env.example ファイルを参照してください。');
    process.exit(1);
  }

  // 警告レベルの環境変数チェック（オプションだが設定を推奨）
  const recommendedVars = ['VITE_GOOGLE_MAPS_MAP_ID', 'VITE_LOG_LEVEL'];

  const missingRecommendedVars = recommendedVars.filter(varName => {
    return !process.env[varName];
  });

  if (missingRecommendedVars.length > 0) {
    console.warn('⚠️ 以下の推奨環境変数が設定されていません:');
    missingRecommendedVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\n   これらの変数を設定することで、アプリケーションの機能が向上します。');
  }

  console.log('✅ 環境変数の検証が完了しました。必須環境変数はすべて設定されています。');
} catch (error) {
  console.error('❌ 環境変数の検証中にエラーが発生しました:', error);
  process.exit(1);
}
