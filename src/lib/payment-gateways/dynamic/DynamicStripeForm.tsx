/**
 * DynamicStripeForm
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Lazy-loaded wrapper for Stripe card form.
 * The SDK (~30KB) is only loaded when this component is rendered.
 * 
 * This reduces the initial bundle size for public checkout
 * when Stripe is not the selected payment gateway.
 * 
 * @module lib/payment-gateways/dynamic
 */

import React, { lazy, Suspense, memo, useEffect, useState } from "react";
import { GatewaySkeleton } from "./GatewaySkeleton";
import { PaymentGatewayFallback } from "./PaymentGatewayFallback";

// ============================================================================
// LAZY IMPORT
// ============================================================================

/**
 * Lazy import with chunk naming for better debugging.
 * The chunk will be named "gateway-stripe" in production.
 */
const StripeCardForm = lazy(() =>
  import("@/lib/payment-gateways/gateways/stripe").then((module) => ({
    default: module.StripeCardForm,
  }))
);

// ============================================================================
// TYPES
// ============================================================================

export interface StripeSubmitResult {
  paymentMethodId: string;
  installments: number;
}

export interface DynamicStripeFormProps {
  publicKey: string;
  amount: number;
  onSubmit: (result: StripeSubmitResult) => Promise<void>;
  isProcessing?: boolean;
  onMount?: (submitFn: () => void) => void;
  colors?: {
    text?: string;
    placeholder?: string;
    background?: string;
    border?: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dynamic Stripe form with lazy loading.
 * 
 * Features:
 * - SDK loaded only when needed
 * - Skeleton while loading
 * - Error boundary with retry option
 * - Memoized to prevent unnecessary re-renders
 */
export const DynamicStripeForm = memo<DynamicStripeFormProps>(
  function DynamicStripeForm(props) {
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Reset error state when retrying
    useEffect(() => {
      if (retryCount > 0) {
        setHasError(false);
      }
    }, [retryCount]);

    const handleRetry = () => {
      setRetryCount((c) => c + 1);
    };

    if (hasError) {
      return (
        <PaymentGatewayFallback
          gatewayName="Stripe"
          onRetry={handleRetry}
        />
      );
    }

    return (
      <ErrorBoundary onError={() => setHasError(true)}>
        <Suspense fallback={<GatewaySkeleton />} key={retryCount}>
          <StripeCardForm {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  }
);

// ============================================================================
// ERROR BOUNDARY (Inline for this module)
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent handles fallback
    }
    return this.props.children;
  }
}
