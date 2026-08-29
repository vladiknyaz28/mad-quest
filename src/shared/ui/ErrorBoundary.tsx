import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Mad Quest render error:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#0b1c24',
          color: '#e8dfd0',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '22rem' }}>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.25rem', color: '#f0e2c4' }}>
            Не удалось запустить квест
          </h1>
          <p style={{ margin: '0 0 1rem', lineHeight: 1.5, opacity: 0.9 }}>
            Попробуй обновить страницу. Если не поможет — открой ссылку в Safari и проверь, что iPad
            обновлён (iOS 14.1 или новее).
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#7ec8b8',
              color: '#0b1c24',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }
}
