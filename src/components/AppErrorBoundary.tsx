/**
 * App Error Boundary
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliant
 * 
 * Features:
 * - Detecção inteligente de erros de rede/chunk loading
 * - UI específica para problemas de conexão
 * - Integração com Sentry para monitoramento
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { createLogger } from '@/lib/logger';
import { isChunkLoadError } from '@/lib/lazyWithRetry';
import { WifiOff, RefreshCw } from 'lucide-react';

const log = createLogger("AppErrorBoundary");

// ============================================================================
// TYPES
// ============================================================================
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempted: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempted: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isNetworkIssue = isChunkLoadError(error);
    
    // AUTO-RECOVERY: Tentar recarregar após erros de rede (apenas 1 vez)
    if (isNetworkIssue && !this.state.recoveryAttempted) {
      log.info("Network error detected - attempting auto-recovery in 2s");
      this.setState({ recoveryAttempted: true });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      return;
    }
    
    log.error('❌ Erro capturado:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      isNetworkIssue,
      timestamp: new Date().toISOString(),
    });

    // Enviar para Sentry com contexto completo
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        isNetworkIssue,
        timestamp: new Date().toISOString(),
      },
      tags: {
        errorType: isNetworkIssue ? 'network_chunk_error' : 'application_error',
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
      const isNetworkIssue = isChunkLoadError(this.state.error);

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            {/* Icon */}
            <div className="flex justify-center">
              {isNetworkIssue ? (
                <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/20">
                  <WifiOff className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                </div>
              ) : (
                <div className="p-4 rounded-full bg-destructive/10">
                  <RefreshCw className="h-12 w-12 text-destructive" />
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                {isNetworkIssue 
                  ? "Problemas de conexão" 
                  : "Ops! Algo deu errado"}
              </h1>
              <p className="text-muted-foreground">
                {isNetworkIssue
                  ? "Não foi possível carregar a página. Verifique sua conexão com a internet e tente novamente."
                  : "Ocorreu um erro inesperado. Por favor, tente recarregar a página."}
              </p>
            </div>

            {/* Error Details (only for non-network errors in dev) */}
            {!isNetworkIssue && this.state.error && (
              <div className="bg-muted p-4 rounded-lg text-left">
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={this.handleReload}
              size="lg"
              className="w-full"
              variant={isNetworkIssue ? "default" : "destructive"}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isNetworkIssue ? "Tentar Novamente" : "Recarregar Página"}
            </Button>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
              {isNetworkIssue
                ? "Dica: Verifique se você está conectado à internet ou tente novamente em alguns segundos."
                : "Se o problema persistir, entre em contato com o suporte."}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
