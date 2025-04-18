import 'react';

/**
 * Reactのaria属性拡張定義
 *
 * WAI-ARIAの属性をReactのTypeScript型システムで
 * より柔軟に使用できるように拡張する定義です。
 * WAI-ARIA 1.2仕様に準拠した属性を定義しています。
 *
 * @see https://www.w3.org/TR/wai-aria-1.2/
 * @version 2.0.0
 * @lastUpdated 2025-04-17
 */
declare module 'react' {
  /**
   * ARIA属性で共通して使用される真偽値の型定義
   * HTML/ARIAではbooleanだけでなく文字列の"true"/"false"も許容される
   */
  type AriaBoolean = boolean | 'true' | 'false';

  /**
   * トライステート（3状態）の真偽値の型定義
   * true, false, mixed（部分的に選択/適用されている状態）
   */
  type AriaTristate = AriaBoolean | 'mixed';

  /**
   * 数値または数値を表す文字列の型定義
   */
  type AriaNumber = number | string;

  /**
   * WAI-ARIAの全ての有効なロール
   * @see https://www.w3.org/TR/wai-aria-1.2/#role_definitions
   */
  type AriaRole =
    // ランドマークロール
    | 'banner'
    | 'complementary'
    | 'contentinfo'
    | 'form'
    | 'main'
    | 'navigation'
    | 'region'
    | 'search'
    // ウィジェットロール
    | 'alert'
    | 'alertdialog'
    | 'button'
    | 'checkbox'
    | 'dialog'
    | 'gridcell'
    | 'link'
    | 'log'
    | 'marquee'
    | 'menuitem'
    | 'menuitemcheckbox'
    | 'menuitemradio'
    | 'option'
    | 'progressbar'
    | 'radio'
    | 'scrollbar'
    | 'searchbox'
    | 'slider'
    | 'spinbutton'
    | 'status'
    | 'switch'
    | 'tab'
    | 'tabpanel'
    | 'textbox'
    | 'timer'
    | 'tooltip'
    | 'treeitem'
    // 複合ウィジェットロール
    | 'combobox'
    | 'grid'
    | 'listbox'
    | 'menu'
    | 'menubar'
    | 'radiogroup'
    | 'tablist'
    | 'tree'
    | 'treegrid'
    // ドキュメント構造ロール
    | 'application'
    | 'article'
    | 'cell'
    | 'columnheader'
    | 'definition'
    | 'directory'
    | 'document'
    | 'feed'
    | 'figure'
    | 'group'
    | 'heading'
    | 'img'
    | 'list'
    | 'listitem'
    | 'math'
    | 'none'
    | 'note'
    | 'presentation'
    | 'row'
    | 'rowgroup'
    | 'rowheader'
    | 'separator'
    | 'table'
    | 'term'
    | 'toolbar'
    | 'tooltip'
    | (string & {});

  /**
   * ライブリージョンの通知方法を表す型
   */
  type AriaLive = 'off' | 'assertive' | 'polite';

  /**
   * 現在位置を表す値の型定義
   */
  type AriaCurrent = AriaBoolean | 'page' | 'step' | 'location' | 'date' | 'time' | (string & {});

  /**
   * スクリーンリーダーでの表示方向に関する型
   */
  type AriaOrientation = 'horizontal' | 'vertical' | undefined;

  /**
   * ソート順序を表す型
   */
  type AriaSort = 'none' | 'ascending' | 'descending' | 'other' | undefined;

  /**
   * 値のタイプを表す型
   */
  type AriaValueNow = AriaNumber;
  type AriaValueText = string;
  type AriaValueMin = AriaNumber;
  type AriaValueMax = AriaNumber;

  interface AriaAttributes {
    /**
     * ===== 状態と特性に関する属性 =====
     */

    /**
     * aria-busy: 要素が更新中であることを示す
     *
     * @example
     * <div aria-busy={isLoading}>...</div>
     * <div aria-busy="true">読み込み中...</div>
     */
    'aria-busy'?: AriaBoolean;

    /**
     * aria-checked: チェックボックスや同様の要素の選択状態
     * - true: 選択されている
     * - false: 選択されていない
     * - mixed: 部分的に選択されている状態
     *
     * @example
     * <input type="checkbox" aria-checked={isChecked} />
     * <div role="checkbox" aria-checked="mixed" />
     */
    'aria-checked'?: AriaTristate;

    /**
     * aria-current: 一連の項目内の現在の項目を示す
     * - page: 現在のページ
     * - step: 複数ステップのうち現在のステップ
     * - location: 現在の場所（地図など）
     * - date: カレンダーなど日付関連のコンテキストでの現在日
     * - time: 時間関連のコンテキストでの現在時刻
     *
     * @example
     * <a href="/home" aria-current="page">ホーム</a>
     * <li aria-current="date">4月17日</li>
     */
    'aria-current'?: AriaCurrent;

    /**
     * aria-disabled: 要素が無効化されていることを示す
     *
     * @example
     * <button aria-disabled={!isValid}>送信</button>
     */
    'aria-disabled'?: AriaBoolean;

    /**
     * aria-expanded: 要素とその子要素の展開状態
     * - true: 展開されている
     * - false: 折りたたまれている
     *
     * @example
     * <button aria-expanded={isExpanded} onClick={toggle}>詳細を表示</button>
     */
    'aria-expanded'?: AriaBoolean;

    /**
     * aria-hidden: アクセシビリティツリーから要素を隠す
     * 視覚的には表示されていても支援技術からは隠される
     *
     * @example
     * <div aria-hidden={isHidden}>...</div>
     */
    'aria-hidden'?: AriaBoolean;

    /**
     * aria-invalid: フォームフィールドが無効な入力を含むことを示す
     * - true: 入力が無効
     * - false: 入力が有効
     * - grammar: 文法エラーがある
     * - spelling: スペルエラーがある
     *
     * @example
     * <input aria-invalid={!isValid} />
     * <textarea aria-invalid="spelling" />
     */
    'aria-invalid'?: AriaBoolean | 'grammar' | 'spelling' | (string & {});

    /**
     * aria-label: 視覚的にラベルがない要素に対してアクセシブルな名前を提供
     *
     * @example
     * <button aria-label="メニューを閉じる">✕</button>
     */
    'aria-label'?: string;

    /**
     * aria-level: 見出しレベルなど階層構造内でのレベルを示す
     *
     * @example
     * <div role="heading" aria-level={2}>セクション見出し</div>
     */
    'aria-level'?: AriaNumber;

    /**
     * aria-modal: 要素がモーダルであることを示す
     *
     * @example
     * <div role="dialog" aria-modal="true">...</div>
     */
    'aria-modal'?: AriaBoolean;

    /**
     * aria-multiline: テキスト入力フィールドが複数行の入力を受け付けるかを示す
     *
     * @example
     * <div role="textbox" aria-multiline="true">...</div>
     */
    'aria-multiline'?: AriaBoolean;

    /**
     * aria-multiselectable: 複数アイテムの選択が可能かを示す
     *
     * @example
     * <ul role="listbox" aria-multiselectable="true">...</ul>
     */
    'aria-multiselectable'?: AriaBoolean;

    /**
     * aria-orientation: コンポーネントの方向（水平・垂直）
     *
     * @example
     * <ul role="tablist" aria-orientation="vertical">...</ul>
     */
    'aria-orientation'?: AriaOrientation;

    /**
     * aria-placeholder: プレースホルダーテキスト
     *
     * @example
     * <div role="textbox" aria-placeholder="検索キーワードを入力">...</div>
     */
    'aria-placeholder'?: string;

    /**
     * aria-pressed: 押下状態を示す
     * - true: 押されている
     * - false: 押されていない
     * - mixed: 部分的に押されている
     *
     * @example
     * <button aria-pressed={isPressed}>お気に入り</button>
     */
    'aria-pressed'?: AriaTristate;

    /**
     * aria-readonly: 要素が読み取り専用であることを示す
     *
     * @example
     * <input aria-readonly={isReadOnly} />
     */
    'aria-readonly'?: AriaBoolean;

    /**
     * aria-required: フォーム要素が必須であることを示す
     *
     * @example
     * <input aria-required="true" />
     */
    'aria-required'?: AriaBoolean;

    /**
     * aria-selected: 選択可能な要素の選択状態
     *
     * @example
     * <div role="option" aria-selected={isSelected}>オプション1</div>
     */
    'aria-selected'?: AriaBoolean;

    /**
     * aria-sort: テーブルやグリッドの列のソート状態
     *
     * @example
     * <th aria-sort="ascending">名前</th>
     */
    'aria-sort'?: AriaSort;

    /**
     * aria-valuemax: 範囲コントロールの最大値
     *
     * @example
     * <div role="slider" aria-valuemax="100">...</div>
     */
    'aria-valuemax'?: AriaValueMax;

    /**
     * aria-valuemin: 範囲コントロールの最小値
     *
     * @example
     * <div role="slider" aria-valuemin="0">...</div>
     */
    'aria-valuemin'?: AriaValueMin;

    /**
     * aria-valuenow: 範囲コントロールの現在値
     *
     * @example
     * <div role="slider" aria-valuenow={currentValue}>...</div>
     */
    'aria-valuenow'?: AriaValueNow;

    /**
     * aria-valuetext: 範囲コントロールの現在値をテキストで表現
     *
     * @example
     * <div role="slider" aria-valuetext="軽度">...</div>
     */
    'aria-valuetext'?: AriaValueText;

    /**
     * ===== ライブリージョン属性 =====
     */

    /**
     * aria-live: ライブリージョンの優先度
     * - off: 更新の通知なし
     * - polite: ユーザーが待機状態になったときに通知
     * - assertive: ユーザーの現在の作業を中断して即座に通知
     *
     * @example
     * <div aria-live="polite">新着メッセージ: {message}</div>
     */
    'aria-live'?: AriaLive;

    /**
     * aria-atomic: 変更を通知する際に領域全体を一つとして扱うかを示す
     * - true: 領域全体を一度に通知
     * - false: 変更された部分のみを通知
     *
     * @example
     * <div aria-live="polite" aria-atomic="true">...</div>
     */
    'aria-atomic'?: AriaBoolean;

    /**
     * aria-relevant: どのような変更を通知するかを示す
     *
     * @example
     * <div aria-live="polite" aria-relevant="additions text">...</div>
     */
    'aria-relevant'?:
      | 'additions'
      | 'additions removals'
      | 'additions text'
      | 'all'
      | 'removals'
      | 'removals additions'
      | 'removals text'
      | 'text'
      | 'text additions'
      | 'text removals'
      | (string & {});

    /**
     * ===== ドラッグ&ドロップ属性 =====
     */

    /**
     * aria-dropeffect: ドラッグ&ドロップ操作で可能な操作タイプ
     *
     * @example
     * <div aria-dropeffect="copy">ここにファイルをドロップ</div>
     */
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup' | (string & {});

    /**
     * aria-grabbed: 要素がドラッグ可能で、現在ユーザーによって掴まれているかどうか
     *
     * @example
     * <div aria-grabbed={isDragging}>...</div>
     */
    'aria-grabbed'?: AriaBoolean;

    /**
     * ===== 関係性を示す属性 =====
     */

    /**
     * aria-activedescendant: 複合コンポーネント内の現在アクティブな子要素を示す
     *
     * @example
     * <ul role="listbox" aria-activedescendant={activeItemId}>...</ul>
     */
    'aria-activedescendant'?: string;

    /**
     * aria-colcount: グリッドまたはテーブルの総列数
     *
     * @example
     * <table aria-colcount={totalColumns}>...</table>
     */
    'aria-colcount'?: AriaNumber;

    /**
     * aria-colindex: 列のインデックス
     *
     * @example
     * <td aria-colindex={colIndex}>...</td>
     */
    'aria-colindex'?: AriaNumber;

    /**
     * aria-colspan: セルが占める列数
     *
     * @example
     * <td aria-colspan="2">...</td>
     */
    'aria-colspan'?: AriaNumber;

    /**
     * aria-controls: 現在の要素によって制御される要素のID
     *
     * @example
     * <button aria-controls="panel1">パネルを開く</button>
     */
    'aria-controls'?: string;

    /**
     * aria-describedby: 要素の詳細な説明を提供する要素のID
     *
     * @example
     * <input aria-describedby="password-hint" />
     */
    'aria-describedby'?: string;

    /**
     * aria-details: 追加情報を提供する要素のID
     *
     * @example
     * <img aria-details="img-desc" src="chart.png" />
     */
    'aria-details'?: string;

    /**
     * aria-errormessage: エラーメッセージを含む要素のID
     *
     * @example
     * <input aria-invalid="true" aria-errormessage="email-error" />
     */
    'aria-errormessage'?: string;

    /**
     * aria-flowto: 読み上げ順序のカスタマイズに使用する要素のID
     *
     * @example
     * <div aria-flowto="next-section">...</div>
     */
    'aria-flowto'?: string;

    /**
     * aria-labelledby: 要素のラベルとして機能する要素のID
     *
     * @example
     * <div role="dialog" aria-labelledby="dialog-title">...</div>
     */
    'aria-labelledby'?: string;

    /**
     * aria-owns: 論理的に現在の要素の子として扱われるべき要素のID
     *
     * @example
     * <div role="combobox" aria-owns="dropdown-list">...</div>
     */
    'aria-owns'?: string;

    /**
     * aria-posinset: 現在の項目のセット内での位置
     *
     * @example
     * <li aria-posinset={index} aria-setsize={total}>...</li>
     */
    'aria-posinset'?: AriaNumber;

    /**
     * aria-rowcount: グリッドの総行数
     *
     * @example
     * <table aria-rowcount={totalRows}>...</table>
     */
    'aria-rowcount'?: AriaNumber;

    /**
     * aria-rowindex: 行のインデックス
     *
     * @example
     * <tr aria-rowindex={rowIndex}>...</tr>
     */
    'aria-rowindex'?: AriaNumber;

    /**
     * aria-rowspan: セルが占める行数
     *
     * @example
     * <td aria-rowspan="2">...</td>
     */
    'aria-rowspan'?: AriaNumber;

    /**
     * aria-setsize: 現在のセットのサイズ
     *
     * @example
     * <li aria-posinset={index} aria-setsize={total}>...</li>
     */
    'aria-setsize'?: AriaNumber;

    /**
     * ===== その他の属性 =====
     */

    /**
     * aria-autocomplete: コンボボックスやテキストボックスの自動補完動作
     *
     * @example
     * <input aria-autocomplete="inline" />
     */
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both' | (string & {});

    /**
     * aria-haspopup: 要素がポップアップ要素を表示することを示す
     *
     * @example
     * <button aria-haspopup="menu">メニューを開く</button>
     */
    'aria-haspopup'?: AriaBoolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | (string & {});

    /**
     * aria-keyshortcuts: 要素をアクティブにするキーボードショートカット
     *
     * @example
     * <button aria-keyshortcuts="Alt+F4">閉じる</button>
     */
    'aria-keyshortcuts'?: string;

    /**
     * aria-roledescription: 要素のロールの人間が読める説明
     *
     * @example
     * <div role="button" aria-roledescription="スライドボタン">...</div>
     */
    'aria-roledescription'?: string;
  }
}
