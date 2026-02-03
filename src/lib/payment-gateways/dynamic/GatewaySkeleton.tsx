/**
 * GatewaySkeleton
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Skeleton placeholder displayed while payment gateway SDKs are loading.
 * Provides visual feedback to users that the form is loading.
 * 
 * @module lib/payment-gateways/dynamic
 */

import React, { memo } from "react";

/**
 * Animated pulse class for skeleton elements
 */
const pulseClass = "animate-pulse bg-muted rounded";

/**
 * Skeleton for a single input field
 */
const FieldSkeleton = memo(function FieldSkeleton() {
  return (
    <div className="space-y-2">
      {/* Label */}
      <div className={`${pulseClass} h-4 w-24`} />
      {/* Input */}
      <div className={`${pulseClass} h-11 w-full`} />
    </div>
  );
});

/**
 * Skeleton for card form while SDK is loading
 * 
 * Matches the visual structure of the actual card form:
 * - Card number field
 * - Expiry and CVV row
 * - Cardholder name
 * - Installments selector
 */
export const GatewaySkeleton = memo(function GatewaySkeleton() {
  return (
    <div 
      className="space-y-4 p-4 border border-border rounded-lg"
      role="status"
      aria-label="Carregando formulário de pagamento..."
    >
      {/* Card Number */}
      <FieldSkeleton />
      
      {/* Expiry and CVV row */}
      <div className="grid grid-cols-2 gap-4">
        <FieldSkeleton />
        <FieldSkeleton />
      </div>
      
      {/* Cardholder Name */}
      <FieldSkeleton />
      
      {/* Installments */}
      <div className="space-y-2">
        <div className={`${pulseClass} h-4 w-20`} />
        <div className={`${pulseClass} h-11 w-full`} />
      </div>
      
      {/* Loading indicator text */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">
          Carregando formulário de pagamento...
        </span>
      </div>
    </div>
  );
});

/**
 * Minimal skeleton for inline loading states
 */
export const GatewaySkeletonCompact = memo(function GatewaySkeletonCompact() {
  return (
    <div 
      className="flex items-center justify-center py-8"
      role="status"
      aria-label="Carregando..."
    >
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">
          Carregando...
        </span>
      </div>
    </div>
  );
});
