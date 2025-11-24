import React from 'react';
import './ErrorBoundary.css';

/**
 * ErrorBoundary - Reactアプリケーション全体のエラーをキャッチするコンポーネント
 *
 * 使用方法:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // エラーが発生したらstateを更新
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // エラー情報をログに記録
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // TODO: 本番環境では、エラートラッキングサービス（Sentry等）に送信
    // Example: Sentry.captureException(error);
  }

  handleReload = () => {
    // ページをリロード
    window.location.reload();
  };

  handleGoHome = () => {
    // ホームに戻る
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1 className="error-boundary-title">エラーが発生しました</h1>
            <p className="error-boundary-message">
              申し訳ございません。予期しないエラーが発生しました。
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary>エラー詳細（開発モードのみ表示）</summary>
                <div className="error-boundary-stack">
                  <p><strong>エラーメッセージ:</strong></p>
                  <pre>{this.state.error.toString()}</pre>

                  {this.state.errorInfo && (
                    <>
                      <p><strong>スタックトレース:</strong></p>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReload}
                className="error-boundary-button primary"
              >
                ページをリロード
              </button>
              <button
                onClick={this.handleGoHome}
                className="error-boundary-button secondary"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
