/**
 * Checkout Error Display Component
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Displays error states with actionable messages and retry capability.
 * 
 * @module checkout-public/components
 */

import React from "react";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ErrorReason } from "../machines";

interface CheckoutErrorDisplayProps {
  errorReason: ErrorReason | string | null;
  errorMessage: string | null;
  canRetry: boolean;
  retryCount: number;
  onRetry: () => void;
  onGiveUp?: () => void;
}

// Error messages mapping
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  FETCH_FAILED: {
    title: "Erro ao carregar checkout",
    description: "Não foi possível carregar os dados do checkout. Verifique sua conexão e tente novamente.",
  },
  VALIDATION_FAILED: {
    title: "Dados inválidos",
    description: "Os dados recebidos do servidor estão em um formato inesperado.",
  },
  CHECKOUT_NOT_FOUND: {
    title: "Checkout não encontrado",
    description: "Este link de checkout não existe ou foi removido.",
  },
  PRODUCT_UNAVAILABLE: {
    title: "Produto indisponível",
    description: "Este produto não está mais disponível para compra.",
  },
  NETWORK_ERROR: {
    title: "Erro de conexão",
    description: "Verifique sua conexão com a internet e tente novamente.",
  },
  UNKNOWN: {
    title: "Erro inesperado",
    description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
  },
};

export const CheckoutErrorDisplay: React.FC<CheckoutErrorDisplayProps> = ({
  errorReason,
  errorMessage,
  canRetry,
  retryCount,
  onRetry,
  onGiveUp,
}) => {
  const reason = errorReason || 'UNKNOWN';
  const errorInfo = ERROR_MESSAGES[reason] || ERROR_MESSAGES.UNKNOWN;
  
  // Show custom message if provided, otherwise use mapped message
  const displayMessage = errorMessage || errorInfo.description;
  
  // Check if it's a "not found" type error (no retry makes sense)
  const isNotFoundError = reason === 'CHECKOUT_NOT_FOUND' || reason === 'PRODUCT_UNAVAILABLE';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--checkout-error-bg))] p-4">
      <div className="max-w-md w-full bg-[hsl(var(--checkout-error-card-bg))] rounded-lg shadow-sm border border-border p-6 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--checkout-error-icon-bg))] flex items-center justify-center mb-4">
          {isNotFoundError ? (
            <XCircle className="w-8 h-8 text-[hsl(var(--checkout-error-icon))]" />
          ) : (
            <AlertCircle className="w-8 h-8 text-[hsl(var(--checkout-error-icon))]" />
          )}
        </div>
        
        {/* Title */}
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {errorInfo.title}
        </h1>
        
        {/* Description */}
        <p className="text-muted-foreground mb-6">
          {displayMessage}
        </p>
        
        {/* Debug info (only in development) */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-muted rounded text-left text-xs font-mono text-muted-foreground">
            <div>Reason: {reason}</div>
            <div>Retries: {retryCount}/3</div>
            {errorMessage && <div>Message: {errorMessage}</div>}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col gap-3">
          {canRetry && !isNotFoundError && (
            <Button
              onClick={onRetry}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
              {retryCount > 0 && ` (${3 - retryCount} restantes)`}
            </Button>
          )}
          
          {onGiveUp && (
            <Button
              onClick={onGiveUp}
              variant="outline"
              className="w-full"
            >
              Voltar
            </Button>
          )}
          
          {!canRetry && !isNotFoundError && (
            <p className="text-sm text-muted-foreground">
              Número máximo de tentativas atingido. Por favor, tente novamente mais tarde.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
