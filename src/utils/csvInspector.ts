import { inspectCSVData, inspectCSVColumn } from './csvProcessor';

/**
 * CSVファイルの内容をコンソールに出力して確認するためのユーティリティ
 *
 * @param csvText - 確認したいCSV文字列
 */
export function logCSVContent(csvText: string): void {
  // CSVデータの全体構造を確認
  const dataPreview = inspectCSVData(csvText);
  console.info('=== CSVデータ内容確認 ===');
  console.info('ヘッダー（列名）:', dataPreview.headers);
  console.info('データサンプル（最大10行）:', dataPreview.rows);
  console.info('総行数:', dataPreview.totalRows);
  console.info('=== CSVデータ内容確認終了 ===');

  // 特に重要な列をいくつか確認
  const importantColumns = ['名称', 'WKT（入力）', '所在地', 'ジャンル'];
  console.info('=== 重要な列のデータ ===');
  importantColumns.forEach(columnName => {
    const columnData = inspectCSVColumn(csvText, columnName);
    if (columnData.columnIndex !== -1) {
      console.info(`${columnName}列のサンプルデータ:`, columnData.values);
    } else {
      console.warn(`${columnName}列が見つかりません`);
    }
  });
  console.info('=== 重要な列のデータ終了 ===');
}
