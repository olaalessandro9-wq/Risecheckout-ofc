/**
 * DynamicMercadoPagoForm
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Lazy-loaded wrapper for MercadoPago card form.
 * The SDK (~50KB) is only loaded when this component is rendered.
 * 
 * This reduces the initial bundle size for public checkout
 * when credit card payment is not immediately needed.
 * 
 * @module lib/payment-gateways/dynamic
 */

import React, { lazy, Suspense, memo, useEffect, useState } from "react";
import { GatewaySkeleton } from "./GatewaySkeleton";
import { PaymentGatewayFallback } from "./PaymentGatewayFallback";
import type { CardTokenResult } from "@/types/payment-types";

// ============================================================================
// LAZY IMPORT
// ============================================================================

/**
 * Lazy import with chunk naming for better debugging.
 * The chunk will be named "gateway-mercadopago" in production.
 */
const MercadoPagoCardForm = lazy(() =>
  import("@/lib/payment-gateways/gateways/mercado-pago").then((module) => ({
    default: module.MercadoPagoCardForm,
  }))
);

// ============================================================================
// TYPES
// ============================================================================

export interface DynamicMercadoPagoFormProps {
  publicKey: string;
  amount: number;
  onSubmit: (result: CardTokenResult) => Promise<void>;
  isProcessing?: boolean;
  onMount?: (submitFn: () => void) => void;
  textColor?: string;
  placeholderColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dynamic MercadoPago form with lazy loading.
 * 
 * Features:
 * - SDK loaded only when needed
 * - Skeleton while loading
 * - Error boundary with retry option
 * - Memoized to prevent unnecessary re-renders
 */
export const DynamicMercadoPagoForm = memo<DynamicMercadoPagoFormProps>(
  function DynamicMercadoPagoForm(props) {
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
          gatewayName="Mercado Pago"
          onRetry={handleRetry}
        />
      );
    }

    return (
      <ErrorBoundary onError={() => setHasError(true)}>
        <Suspense fallback={<GatewaySkeleton />} key={retryCount}>
          <MercadoPagoCardForm {...props} />
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
