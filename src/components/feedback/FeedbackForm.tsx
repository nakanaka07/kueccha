/**
 * FeedbackForm.tsx
 *
 * このファイルはユーザーからのフィードバックを収集するためのフォームコンポーネントを実装しています。
 * ユーザーは名前、メールアドレス、メッセージを入力し、送信することができます。
 * 送信されたフィードバックはemailJSサービスを使用してメールで送信されます。
 * フォームにはバリデーション機能が組み込まれており、必要なフィールドが空でないことと
 * メールアドレスの形式が正しいことを確認します。
 */

// emailjsライブラリをインポート - フィードバックをメールとして送信するために使用
import emailjs from '@emailjs/browser';
// Reactと必要なフックをインポート - コンポーネントの状態管理とライフサイクル管理に使用
import React, { useState, useEffect } from 'react';
// CSSファイルをインポート - コンポーネントのスタイルを適用するため
import './FeedbackForm.module.css';
// エラーメッセージの定数をインポート - 一貫したエラーメッセージを表示するため
import { ERROR_MESSAGES } from '../../utils/constants';
// 型定義をインポート - TypeScriptの型安全性を確保するため
import type { FeedbackFormProps, TemplateParams } from '../../utils/types';

/**
 * フィードバックフォームコンポーネント
 *
 * @param {Function} onClose - フォームを閉じるための関数。親コンポーネントから渡される。
 * @returns {JSX.Element} フィードバックフォームのUI
 */
const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  // 名前の状態変数とその更新関数を定義。初期値は空文字列。
  // ユーザーの名前を保存し、フォーム送信時に使用する
  const [name, setName] = useState('');

  // メールアドレスの状態変数とその更新関数を定義。初期値は空文字列。
  // ユーザーのメールアドレスを保存し、フォーム送信時に使用する（任意フィールド）
  const [email, setEmail] = useState('');

  // メッセージの状態変数とその更新関数を定義。初期値は空文字列。
  // ユーザーのフィードバックメッセージを保存し、フォーム送信時に使用する
  const [message, setMessage] = useState('');

  // フォームが送信されたかどうかの状態変数とその更新関数を定義。初期値はfalse。
  // 送信完了後のUI表示を切り替えるために使用
  const [isSubmitted, setIsSubmitted] = useState(false);

  // エラーメッセージの状態変数とその更新関数を定義。初期値は空文字列。
  // バリデーションエラーや送信エラー時にメッセージを表示するために使用
  const [error, setError] = useState('');

  // ローディング状態の状態変数とその更新関数を定義。初期値はfalse。
  // フォーム送信中のUI状態を管理し、二重送信を防止するために使用
  const [isLoading, setIsLoading] = useState(false);

  /**
   * フォームのバリデーション関数
   * 必須フィールドのチェックとメールアドレスの形式チェックを行う
   *
   * @returns {boolean} フォームが有効な場合はtrue、無効な場合はfalse
   */
  const validateForm = () => {
    // 名前が空の場合のエラーメッセージを設定
    // trim()で前後の空白を削除し、実質的に空かどうかをチェック
    if (!name.trim()) {
      setError(ERROR_MESSAGES.FORM.EMPTY_NAME);
      return false;
    }

    // メッセージが空の場合のエラーメッセージを設定
    // trim()で前後の空白を削除し、実質的に空かどうかをチェック
    if (!message.trim()) {
      setError(ERROR_MESSAGES.FORM.EMPTY_MESSAGE);
      return false;
    }

    // メールアドレスが入力されている場合のみ、形式をチェック（任意フィールドのため、空は許容）
    // 正規表現を使用してメールアドレスの形式を検証
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(ERROR_MESSAGES.FORM.INVALID_EMAIL);
      return false;
    }

    // すべてのバリデーションをパスした場合、エラーメッセージをクリアしてtrueを返す
    setError('');
    return true;
  };

  /**
   * フィードバックを送信する関数
   * emailjsを使用してフィードバックをメールで送信する
   *
   * @param {React.FormEvent} e - フォーム送信イベント
   * @returns {Promise<void>}
   */
  const sendFeedback = async (e: React.FormEvent) => {
    // フォームのデフォルトの送信動作を防止（ページのリロードを防ぐ）
    e.preventDefault();

    // フォームのバリデーションを実行し、無効な場合は処理を中断
    if (!validateForm()) return;

    // ローディング状態を設定し、送信中のUIを表示
    setIsLoading(true);

    try {
      // テンプレートパラメータを設定
      // 未入力の場合はデフォルト値を設定（名前は「匿名」、その他は「未入力」）
      const templateParams: TemplateParams = {
        name: name || '匿名',
        email: email || '未入力',
        message: message || '未入力',
      };

      // emailjsを使用してフィードバックを送信
      // 環境変数から必要なIDとキーを取得
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID, // EmailJSのサービスID
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID, // 使用するメールテンプレートID
        templateParams as Record<string, unknown>, // 送信するデータ
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY, // EmailJSの公開キー
      );

      // 送信成功時の処理
      setIsSubmitted(true); // フォームが送信されたことを設定し、成功メッセージを表示
      setError(''); // エラーメッセージをクリア
    } catch {
      // 送信失敗時の処理
      setError(ERROR_MESSAGES.FORM.SUBMISSION_FAILED); // エラーメッセージを設定
    } finally {
      // 成功・失敗に関わらず実行される処理
      setIsLoading(false); // ローディング状態を解除
    }
  };

  /**
   * フォームが送信された後に状態をリセットするuseEffectフック
   * isSubmittedがtrueになった時に実行され、フォームフィールドをクリアする
   */
  useEffect(() => {
    // フォームが送信された状態の場合のみ実行
    if (isSubmitted) {
      setName(''); // 名前フィールドをリセット
      setEmail(''); // メールアドレスフィールドをリセット
      setMessage(''); // メッセージフィールドをリセット
    }
  }, [isSubmitted]); // isSubmittedが変更されたときにのみ実行（依存配列）

  return (
    // フィードバックフォームのラッパー
    // role="dialog"とaria-labelledbyでアクセシビリティを確保
    <div className="feedback-form-wrapper" role="dialog" aria-labelledby="feedback-title">
      {/* 閉じるボタン - フォームを閉じるためのボタン */}
      <button className="close-button" onClick={onClose} aria-label="閉じる">
        ×
      </button>
      {/* 条件付きレンダリング - 送信成功時は成功メッセージ、それ以外はフォームを表示 */}
      {isSubmitted ? (
        // フォーム送信後の成功メッセージ
        // role="alert"でスクリーンリーダーにメッセージを通知
        <div role="alert">フィードバックを送信しました。ありがとうございます。</div>
      ) : (
        // フィードバックフォーム - 送信前の入力フォーム
        // noValidateで組み込みのHTML5バリデーションを無効化し、カスタムバリデーションを使用
        <form onSubmit={sendFeedback} noValidate>
          <h2 id="feedback-title">フィードバック</h2>
          {/* エラーメッセージの表示 - エラーがある場合のみ表示 */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {/* 名前入力フィールド - 必須項目 */}
          <label htmlFor="name">
            名前:
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value); // 名前の状態を更新
                setError(''); // 入力があればエラーメッセージをクリア
              }}
              aria-label="名前"
            />
          </label>
          {/* メール入力フィールド - 任意項目 */}
          <label htmlFor="email">
            メール:
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value); // メールの状態を更新
                setError(''); // 入力があればエラーメッセージをクリア
              }}
              aria-label="メール"
            />
          </label>
          {/* メッセージ入力フィールド - 必須項目 */}
          <label htmlFor="message">
            メッセージ:
            <textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value); // メッセージの状態を更新
                setError(''); // 入力があればエラーメッセージをクリア
              }}
              aria-label="メッセージ"
            />
          </label>
          {/* 送信ボタン - ローディング中は無効化 */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? '送信中...' : '送信'} {/* ローディング状態に応じてボタンテキストを変更 */}
          </button>
        </form>
      )}
    </div>
  );
};

// コンポーネントをエクスポートして他のファイルから使用できるようにする
export default FeedbackForm;
