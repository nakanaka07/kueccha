import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    // Appコンポーネントをレンダリング
    const { container } = render(<App />);
    // コンテナが存在することを確認
    expect(container).toBeDefined();
  });
});
