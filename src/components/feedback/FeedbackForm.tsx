// emailjsライブラリをインポート
import emailjs from '@emailjs/browser';
// Reactと必要なフックをインポート
import React, { useState, useEffect } from 'react';
// CSSファイルをインポート
import './FeedbackForm.css';
// 定数をインポート
import { ERROR_MESSAGES } from '../../utils/constants';
// 型定義をインポート
import type { FeedbackFormProps, TemplateParams } from '../../utils/types';

// FeedbackFormコンポーネントを定義
const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  // 名前の状態変数とその更新関数を定義
  const [name, setName] = useState('');
  // メールアドレスの状態変数とその更新関数を定義
  const [email, setEmail] = useState('');
  // メッセージの状態変数とその更新関数を定義
  const [message, setMessage] = useState('');
  // フォームが送信されたかどうかの状態変数とその更新関数を定義
  const [isSubmitted, setIsSubmitted] = useState(false);
  // エラーメッセージの状態変数とその更新関数を定義
  const [error, setError] = useState('');
  // ローディング状態の状態変数とその更新関数を定義
  const [isLoading, setIsLoading] = useState(false);

  // フォームのバリデーション関数
  const validateForm = () => {
    // 名前が空の場合のエラーメッセージを設定
    if (!name.trim()) {
      setError(ERROR_MESSAGES.FORM.EMPTY_NAME);
      console.log('Validation failed: empty name'); // ログ出力を追加
      return false;
    }

    // メッセージが空の場合のエラーメッセージを設定
    if (!message.trim()) {
      setError(ERROR_MESSAGES.FORM.EMPTY_MESSAGE);
      console.log('Validation failed: empty message'); // ログ出力を追加
      return false;
    }

    // メールアドレスが無効な場合のエラーメッセージを設定
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(ERROR_MESSAGES.FORM.INVALID_EMAIL);
      console.log('Validation failed: invalid email'); // ログ出力を追加
      return false;
    }

    // エラーメッセージをクリア
    setError('');
    return true;
  };

  // フィードバックを送信する関数
  const sendFeedback = async (e: React.FormEvent) => {
    e.preventDefault(); // フォームのデフォルトの送信動作を防止

    // フォームのバリデーションを実行
    if (!validateForm()) return;

    setIsLoading(true); // ローディング状態を設定
    console.log('Sending feedback...'); // ログ出力を追加

    try {
      // テンプレートパラメータを設定
      const templateParams: TemplateParams = {
        name: name || '匿名',
        email: email || '未入力',
        message: message || '未入力',
      };

      // emailjsを使用してフィードバックを送信
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams as Record<string, unknown>,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );

      setIsSubmitted(true); // フォームが送信されたことを設定
      setError(''); // エラーメッセージをクリア
      console.log('Feedback sent successfully'); // ログ出力を追加
    } catch (err) {
      setError(ERROR_MESSAGES.FORM.SUBMISSION_FAILED); // エラーメッセージを設定
      console.error('Feedback submission error:', err); // エラーをログ出力
    } finally {
      setIsLoading(false); // ローディング状態を解除
    }
  };

  // フォームが送信された後に状態をリセットするuseEffectフック
  useEffect(() => {
    if (isSubmitted) {
      setName(''); // 名前をリセット
      setEmail(''); // メールアドレスをリセット
      setMessage(''); // メッセージをリセット
      console.log('Form reset after submission'); // ログ出力を追加
    }
  }, [isSubmitted]);

  return (
    // フィードバックフォームのラッパー
    <div
      className="feedback-form-wrapper"
      role="dialog"
      aria-labelledby="feedback-title"
    >
      {/* 閉じるボタン */}
      <button className="close-button" onClick={onClose} aria-label="閉じる">
        ×
      </button>
      {isSubmitted ? (
        // フォーム送信後のメッセージ
        <div role="alert">
          フィードバックを送信しました。ありがとうございます。
        </div>
      ) : (
        // フィードバックフォーム
        <form onSubmit={sendFeedback} noValidate>
          <h2 id="feedback-title">フィードバック</h2>
          {/* エラーメッセージの表示 */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {/* 名前入力フィールド */}
          <label htmlFor="name">
            名前:
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              aria-label="名前"
            />
          </label>
          {/* メール入力フィールド */}
          <label htmlFor="email">
            メール:
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              aria-label="メール"
            />
          </label>
          {/* メッセージ入力フィールド */}
          <label htmlFor="message">
            メッセージ:
            <textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
              }}
              aria-label="メッセージ"
            />
          </label>
          {/* 送信ボタン */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? '送信中...' : '送信'}
          </button>
        </form>
      )}
    </div>
  );
};

// コンポーネントをエクスポート
export default FeedbackForm;
