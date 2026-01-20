/**
 * Checkout Public Loader Component
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This is the main entry point for the public checkout page.
 * It uses the XState state machine to manage all state transitions.
 * 
 * @module checkout-public/components
 */

import React from "react";
import { Loader2 } from "lucide-react";
import { useCheckoutPublicMachine } from "../hooks";
import { CheckoutErrorDisplay } from "./CheckoutErrorDisplay";
import { CheckoutPublicContent } from "./CheckoutPublicContent";

export const CheckoutPublicLoader: React.FC = () => {
  const machine = useCheckoutPublicMachine();
  
  const {
    isIdle,
    isLoading,
    isValidating,
    isError,
    isReady,
    isSubmitting,
    isPaymentPending,
    isSuccess,
    errorReason,
    errorMessage,
    canRetry,
    retryCount,
    retry,
    giveUp,
    checkout,
    product,
    design,
  } = machine;

  // Loading state (initial load only)
  if (isIdle || isLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  // Error state (machine error, not payment error)
  if (isError) {
    return (
      <CheckoutErrorDisplay
        errorReason={errorReason}
        errorMessage={errorMessage}
        canRetry={canRetry}
        retryCount={retryCount}
        onRetry={retry}
        onGiveUp={giveUp}
      />
    );
  }

  // CRITICAL: Keep content mounted during ALL processing states
  // This includes: ready, submitting, paymentPending, success
  // The spinner/loading UI is handled INSIDE CheckoutPublicContent
  const shouldShowContent = isReady || isSubmitting || isPaymentPending || isSuccess;
  
  if (shouldShowContent && checkout && product && design) {
    return <CheckoutPublicContent machine={machine} />;
  }

  // Fallback: Only show error if we truly have no data
  // This should rarely happen - only for invalid slugs or network failures
  return (
    <CheckoutErrorDisplay
      errorReason="CHECKOUT_NOT_FOUND"
      errorMessage="Checkout não encontrado"
      canRetry={false}
      retryCount={0}
      onRetry={() => {}}
    />
  );
};
