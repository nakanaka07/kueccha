/**
 * ベースパス自動設定スクリプト
 *
 * このスクリプトは現在のリポジトリ名を自動検出し、
 * GitHub Pages用のベースパスを設定します。
 *
 * 使用方法: デプロイ前に実行
 * node scripts/set-base-path.mjs
 */

// ESLintのグローバル変数定義
/* global process, console */

// import順序を修正
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * エラータイプ列挙
 * エラーの種類を明確に分類し、適切な回復戦略を適用するために使用
 */
const ErrorType = {
  GIT_ERROR: 'git_error', // Gitコマンド関連のエラー
  FILE_READ_ERROR: 'file_read_error', // ファイル読み込みエラー
  FILE_WRITE_ERROR: 'file_write_error', // ファイル書き込みエラー
  PARSE_ERROR: 'parse_error', // JSONパース等のエラー
  ENV_ERROR: 'env_error', // 環境変数ファイル関連のエラー
  UNKNOWN_ERROR: 'unknown_error', // 未分類エラー
};

/**
 * エラー情報をログに記録する関数
 * @param {string} type エラータイプ
 * @param {string} message エラーメッセージ
 * @param {Error|null} error 元のエラーオブジェクト（オプション）
 * @param {Object|null} context 追加コンテキスト情報（オプション）
 */
function logError(type, message, error = null, context = null) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    type,
    message,
    error: error ? { name: error.name, message: error.message, stack: error.stack } : null,
    context,
  };

  // コンソールにエラー情報を出力
  console.error(`❌ [${timestamp}][${type}] ${message}`);
  if (error) {
    console.error(`  詳細: ${error.message}`);
  }

  // エラーログを保存
  try {
    const logDir = path.resolve(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'set-base-path-errors.log');
    const logEntry = `${JSON.stringify(errorInfo)}\n`;

    fs.appendFileSync(logFile, logEntry);
  } catch (loggingError) {
    // ロギング自体が失敗した場合はコンソールに出力するだけ
    console.error('⚠️ エラーログの保存に失敗しました:', loggingError.message);
  }

  return errorInfo;
}

// __dirnameの代替（ESモジュールで使用するため）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// リポジトリ名を取得する関数
function getRepositoryName() {
  try {
    // gitコマンドからリモートURLを取得
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();

    // URLからリポジトリ名を抽出
    let repoName = '';

    if (remoteUrl.includes('github.com')) {
      // GitHub URLからリポジトリ名を抽出
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
      if (match && match[2]) {
        repoName = match[2];
      }
    }

    if (!repoName) {
      // フォールバック：カレントディレクトリ名をリポジトリ名として使用
      const fallbackName = path.basename(process.cwd());
      logError(
        ErrorType.GIT_ERROR,
        'リポジトリ名の抽出に失敗しました。フォールバックとして現在のディレクトリ名を使用します。',
        null,
        { remoteUrl, fallbackName }
      );
      repoName = fallbackName;
    }

    return repoName;
  } catch (error) {
    // 構造化されたエラーハンドリング
    const fallbackName = path.basename(process.cwd());
    logError(
      ErrorType.GIT_ERROR,
      'Gitコマンド実行中にエラーが発生しました。フォールバックとして現在のディレクトリ名を使用します。',
      error,
      { fallbackName }
    );

    console.info('⚠️ リポジトリ名の自動検出に失敗しました。現在のディレクトリ名を使用します。');
    return fallbackName;
  }
}

// build:ghpagesスクリプトを更新する関数
function updateBuildScript(repoName) {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const fallbackEnvPath = path.resolve(__dirname, '../.env.production.local');
  const manualInstructionsPath = path.resolve(__dirname, '../deploy-instructions.md');

  try {
    // package.jsonを読み込み
    let packageJson;
    try {
      const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
      packageJson = JSON.parse(packageJsonContent);
    } catch (readError) {
      // ファイル読み込みエラーの特定処理
      if (readError.code === 'ENOENT') {
        throw Object.assign(new Error(`package.jsonファイルが見つかりません: ${packageJsonPath}`), {
          code: 'ENOENT',
          originalError: readError,
        });
      } else if (readError instanceof SyntaxError) {
        logError(ErrorType.PARSE_ERROR, 'package.jsonの構文解析に失敗しました', readError, {
          path: packageJsonPath,
        });
        // マニュアル手順ファイルを作成
        createManualInstructionsFile(repoName, manualInstructionsPath);
        throw Object.assign(new Error('package.jsonの構文解析に失敗しました'), {
          originalError: readError,
        });
      }
      throw readError;
    }

    // 現在のbuild:ghpagesスクリプトを取得
    const currentBuildScript = packageJson.scripts?.['build:ghpages'] || '';

    if (!currentBuildScript) {
      // build:ghpagesスクリプトがない場合は新規作成
      console.info('⚠️ build:ghpagesスクリプトが見つかりません。新規作成します。');
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['build:ghpages'] = `VITE_BASE_PATH=/${repoName}/ npm run build`;
    } else {
      // VITE_BASE_PATHの部分を更新
      const updatedBuildScript = currentBuildScript.replace(
        /VITE_BASE_PATH=\/[^/\s]+\//,
        `VITE_BASE_PATH=/${repoName}/`
      );

      // 変更がない場合は処理を終了
      if (currentBuildScript === updatedBuildScript) {
        console.info(`✅ ベースパスはすでに /${repoName}/ に設定されています`);

        // 環境変数ファイルも確認
        updateEnvFile(repoName, fallbackEnvPath);

        return;
      }

      // 更新
      packageJson.scripts['build:ghpages'] = updatedBuildScript;
    }

    // package.jsonを書き込み
    try {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.info(`✅ ベースパスを /${repoName}/ に更新しました`);
    } catch (writeError) {
      logError(ErrorType.FILE_WRITE_ERROR, 'package.jsonの更新に失敗しました', writeError, {
        path: packageJsonPath,
      });

      // マニュアル手順ファイルを作成
      createManualInstructionsFile(repoName, manualInstructionsPath);

      throw Object.assign(new Error('package.jsonの更新に失敗しました'), {
        originalError: writeError,
      });
    }

    // 環境変数ファイルを更新
    updateEnvFile(repoName, fallbackEnvPath);
  } catch (error) {
    // エラーの種類を特定して適切なハンドリングを行う
    const errorType =
      error.code === 'ENOENT'
        ? ErrorType.FILE_READ_ERROR
        : error.originalError instanceof SyntaxError
          ? ErrorType.PARSE_ERROR
          : error.originalError?.code === 'EACCES'
            ? ErrorType.FILE_WRITE_ERROR
            : ErrorType.UNKNOWN_ERROR;

    logError(errorType, 'ビルドスクリプトの更新中にエラーが発生しました', error, { repoName });

    console.error('❌ package.jsonの更新中にエラーが発生しました:', error.message);

    // マニュアル手順を生成
    try {
      createManualInstructionsFile(repoName, manualInstructionsPath);
      console.info(`ℹ️ マニュアル設定手順を ${manualInstructionsPath} に作成しました`);
    } catch (instructionError) {
      console.error('⚠️ 手順ファイルの作成にも失敗しました:', instructionError.message);
    }

    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      throw error; // テスト環境ではエラーを再スローして検出可能にする
    }
  }
}

/**
 * 環境変数ファイルを更新する関数
 * @param {string} repoName リポジトリ名
 * @param {string} envFilePath 環境変数ファイルパス
 */
function updateEnvFile(repoName, envFilePath) {
  try {
    fs.writeFileSync(envFilePath, `VITE_BASE_PATH=/${repoName}/\n`);
    console.info(`✅ 環境変数ファイル .env.production.local を作成しました`);
  } catch (envError) {
    logError(ErrorType.ENV_ERROR, '環境変数ファイルの作成に失敗しました', envError, {
      path: envFilePath,
      repoName,
    });
    console.warn(
      `⚠️ 環境変数ファイル ${envFilePath} の作成に失敗しました。手動で設定が必要な場合があります。`
    );
  }
}

/**
 * マニュアル設定手順ファイルを作成する関数
 * @param {string} repoName リポジトリ名
 * @param {string} filePath 出力先ファイルパス
 */
function createManualInstructionsFile(repoName, filePath) {
  const instructions = `# GitHub Pagesデプロイのためのマニュアル設定手順

自動設定に失敗したため、以下の手順で手動でベースパスを設定してください。

## package.jsonの設定

\`package.json\`ファイルを開き、以下のスクリプトを追加または修正してください：

\`\`\`json
{
  "scripts": {
    "build:ghpages": "VITE_BASE_PATH=/${repoName}/ npm run build"
  }
}
\`\`\`

## 環境変数ファイルの設定

\`.env.production.local\`ファイルを作成し、以下の内容を追加してください：

\`\`\`
VITE_BASE_PATH=/${repoName}/
\`\`\`

## デプロイ方法

設定が完了したら、以下のコマンドでビルドとデプロイを行ってください：

\`\`\`bash
npm run build:ghpages
# または
yarn build:ghpages
\`\`\`

生成されたdistフォルダの内容をGitHub Pagesにアップロードしてください。

作成日時: ${new Date().toISOString()}
`;

  fs.writeFileSync(filePath, instructions);
}

/**
 * ヘルプメッセージを表示する関数
 */
function showHelp() {
  console.info(`
🔍 ベースパス自動設定スクリプト

使用法: node scripts/set-base-path.mjs [オプション]

オプション:
  --help, -h     このヘルプメッセージを表示
  --verbose, -v  詳細なログ出力を有効化
  --manual       マニュアル設定手順のみを生成

説明:
  このスクリプトはリポジトリ名を自動検出し、GitHub Pages用のベースパスを
  設定します。package.jsonのbuild:ghpagesスクリプトと.env.production.localファイルを
  更新します。
  
例:
  node scripts/set-base-path.mjs
  node scripts/set-base-path.mjs --verbose
  `);
}

// メイン処理
try {
  // コマンドライン引数の処理
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const isVerbose = args.includes('--verbose') || args.includes('-v');
  const isManualOnly = args.includes('--manual');

  if (isVerbose) {
    console.info('📊 詳細ログモードが有効です');
  }

  // リポジトリ名を取得
  const repoName = getRepositoryName();
  console.info(`📂 検出されたリポジトリ名: ${repoName}`);

  if (isManualOnly) {
    // マニュアル手順のみを生成
    const manualInstructionsPath = path.resolve(__dirname, '../deploy-instructions.md');
    createManualInstructionsFile(repoName, manualInstructionsPath);
    console.info(`✅ マニュアル設定手順を ${manualInstructionsPath} に作成しました`);
    process.exit(0);
  }

  // ビルドスクリプトを更新
  updateBuildScript(repoName);

  // 結果をチェックして成功メッセージを表示
  console.info('🚀 ベースパス設定が完了しました');

  // エラーログファイルの存在を確認し、ある場合は通知
  const logDir = path.resolve(__dirname, '../logs');
  const logFile = path.join(logDir, 'set-base-path-errors.log');

  if (fs.existsSync(logFile)) {
    console.info(`ℹ️ 過去のエラーログが ${logFile} に保存されています`);
  }
} catch (error) {
  // 未分類エラーの場合は適切に記録
  logError(ErrorType.UNKNOWN_ERROR, '予期せぬエラーが発生しました', error);

  console.error('❌ 処理中にエラーが発生しました:', error.message);
  console.error('💡 ヒント: --help オプションで使用方法を確認できます');

  // マニュアル手順を生成
  try {
    const repoName = path.basename(process.cwd()); // フォールバックでディレクトリ名を使用
    const manualInstructionsPath = path.resolve(__dirname, '../deploy-instructions.md');
    createManualInstructionsFile(repoName, manualInstructionsPath);
    console.info(`ℹ️ マニュアル設定手順を ${manualInstructionsPath} に作成しました`);
  } catch (instructionError) {
    console.error('⚠️ 手順ファイルの作成にも失敗しました:', instructionError.message);
  }

  process.exit(1);
}
