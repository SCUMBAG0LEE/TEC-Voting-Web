import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary
 * Catches render errors in child components and displays a fallback UI
 * instead of crashing the entire app to a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: "'Open Sans', Helvetica, Arial, sans-serif",
          color: '#fff',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(18, 18, 18, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#F32C9E' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#a0aec0', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details style={{ 
                textAlign: 'left', 
                marginBottom: '1.5rem', 
                fontSize: '0.8rem', 
                color: '#718096',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '8px',
                padding: '0.75rem',
              }}>
                <summary style={{ cursor: 'pointer', color: '#a0aec0', marginBottom: '0.5rem' }}>Error details</summary>
                <code style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.message}
                </code>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #39C5BB 0%, #0d9488 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '30px',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
