/**
 * PaymentGatewayFallback
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Fallback UI displayed when a payment gateway fails to load.
 * Provides user-friendly error message and retry option.
 * 
 * @module lib/payment-gateways/dynamic
 */

import React, { memo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentGatewayFallbackProps {
  /** Name of the gateway that failed to load */
  gatewayName: string;
  /** Callback to retry loading the gateway */
  onRetry?: () => void;
  /** Custom error message */
  errorMessage?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Fallback component for payment gateway loading failures.
 * 
 * Displayed when:
 * - SDK fails to load from CDN
 * - Network error during chunk loading
 * - JavaScript error during gateway initialization
 */
export const PaymentGatewayFallback = memo<PaymentGatewayFallbackProps>(
  function PaymentGatewayFallback({
    gatewayName,
    onRetry,
    errorMessage,
  }) {
    return (
      <div 
        className="p-6 border border-destructive/30 bg-destructive/5 rounded-lg"
        role="alert"
        aria-live="polite"
      >
        <div className="flex flex-col items-center text-center gap-4">
          {/* Error Icon */}
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          
          {/* Error Message */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">
              Erro ao carregar {gatewayName}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {errorMessage || 
                "Não foi possível carregar o formulário de pagamento. " +
                "Verifique sua conexão e tente novamente."
              }
            </p>
          </div>
          
          {/* Retry Button */}
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          )}
          
          {/* Alternative Action */}
          <p className="text-xs text-muted-foreground">
            Se o problema persistir, tente usar outro método de pagamento.
          </p>
        </div>
      </div>
    );
  }
);
