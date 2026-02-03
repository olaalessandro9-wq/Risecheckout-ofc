/**
 * CheckoutErrorBoundary
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Error boundary specifically designed for the public checkout.
 * Provides user-friendly error handling with retry capabilities.
 * 
 * Features:
 * - Graceful error recovery
 * - Retry mechanism for transient errors
 * - User-friendly error messages
 * - Logging for debugging in production
 * 
 * @module checkout-public/components
 */

import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLogger } from "@/lib/logger";

const log = createLogger("CheckoutErrorBoundary");

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutErrorBoundaryProps {
  children: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Slug for retry navigation */
  slug?: string;
}

interface CheckoutErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Error boundary that catches React rendering errors in the checkout flow.
 * 
 * This component wraps the entire checkout and provides:
 * - User-friendly error message
 * - Retry button to reload the page
 * - Home button to navigate away
 * - Error logging for debugging
 */
export class CheckoutErrorBoundary extends Component<
  CheckoutErrorBoundaryProps,
  CheckoutErrorBoundaryState
> {
  constructor(props: CheckoutErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CheckoutErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging
    log.error("Checkout error caught:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    // Reset state and increment retry count
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
    
    // Force page reload to reset all state
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            
            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Ops! Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                Não foi possível carregar o checkout. Por favor, tente novamente.
              </p>
            </div>
            
            {/* Retry Count Warning */}
            {this.state.retryCount > 2 && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                Se o problema persistir, entre em contato com o suporte.
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </Button>
              
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Ir para o início
              </Button>
            </div>
            
            {/* Technical Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
