import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] ❌ Erro capturado:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Enviar para Sentry com contexto completo
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      },
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Ops! Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente recarregar a página.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-muted p-4 rounded-lg text-left">
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <Button
              onClick={this.handleReload}
              size="lg"
              className="w-full"
            >
              Recarregar Página
            </Button>

            <p className="text-xs text-muted-foreground">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
