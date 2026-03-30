import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6">
          <div className="glass-lg rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-red-400 text-3xl">error_outline</span>
            </div>
            <h1 className="text-xl font-bold text-textLight mb-2">
              Algo correu mal
            </h1>
            <p className="text-textMuted text-sm mb-6">
              Encontrámos um erro inesperado. Por favor, tenta novamente.
            </p>
            {this.state.error && (
              <details className="text-left mb-4 p-3 bg-red-500/10 rounded-lg">
                <summary className="text-red-400 text-xs cursor-pointer">
                  Detalhes do erro
                </summary>
                <pre className="text-xs text-textMuted mt-2 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;