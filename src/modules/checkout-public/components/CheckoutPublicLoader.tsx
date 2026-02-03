/**
 * Checkout Public Loader Component
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This is the main entry point for the public checkout page.
 * It uses the XState state machine to manage all state transitions.
 * 
 * ZERO LATENCY ARCHITECTURE:
 * - Shows CheckoutSkeleton INSTANTLY (0ms perceived latency)
 * - Uses resolve-universal BFF (single HTTP call)
 * - Accepts both checkout_slug and payment_link_slug
 * 
 * @module checkout-public/components
 */

import React from "react";
import { useParams } from "react-router-dom";
import { useCheckoutPublicMachine } from "../hooks";
import { CheckoutErrorDisplay } from "./CheckoutErrorDisplay";
import { CheckoutPublicContent } from "./CheckoutPublicContent";
import { CheckoutErrorBoundary } from "./CheckoutErrorBoundary";
import { OfflineIndicator } from "./OfflineIndicator";
import { CheckoutSkeleton } from "./CheckoutSkeleton";

export const CheckoutPublicLoader: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
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

  // ZERO LATENCY: Show skeleton INSTANTLY during loading states
  // This eliminates the "Processing payment link..." and "Loading checkout..." screens
  if (isIdle || isLoading || isValidating) {
    return (
      <>
        <OfflineIndicator />
        <CheckoutSkeleton />
      </>
    );
  }

  // Error state (machine error, not payment error)
  if (isError) {
    return (
      <>
        <OfflineIndicator />
        <CheckoutErrorDisplay
          errorReason={errorReason}
          errorMessage={errorMessage}
          canRetry={canRetry}
          retryCount={retryCount}
          onRetry={retry}
          onGiveUp={giveUp}
        />
      </>
    );
  }

  // CRITICAL: Keep content mounted during ALL processing states
  // This includes: ready, submitting, paymentPending, success
  // The spinner/loading UI is handled INSIDE CheckoutPublicContent
  const shouldShowContent = isReady || isSubmitting || isPaymentPending || isSuccess;
  
  if (shouldShowContent && checkout && product && design) {
    return (
      <>
        <OfflineIndicator />
        <CheckoutErrorBoundary slug={slug || 'unknown'}>
          <CheckoutPublicContent machine={machine} />
        </CheckoutErrorBoundary>
      </>
    );
  }

  // Fallback: Only show error if we truly have no data
  // This should rarely happen - only for invalid slugs or network failures
  return (
    <>
      <OfflineIndicator />
      <CheckoutErrorDisplay
        errorReason="CHECKOUT_NOT_FOUND"
        errorMessage="Checkout não encontrado"
        canRetry={false}
        retryCount={0}
        onRetry={() => {}}
      />
    </>
  );
};
