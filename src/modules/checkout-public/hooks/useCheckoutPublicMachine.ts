/**
 * Hook: useCheckoutPublicMachine
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * React hook that exposes the checkout public state machine.
 * This is the ONLY way React components should interact with checkout state.
 * 
 * @module checkout-public/hooks
 */

import { useMachine } from "@xstate/react";
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useCallback, useMemo } from "react";
import { checkoutPublicMachine } from "../machines";
import type { FormData, CouponData, PaymentData, NavigationData, CardFormData } from "../machines/checkoutPublicMachine.types";
import { getAffiliateCode } from "@/hooks/checkout/helpers";

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseCheckoutPublicMachineReturn {
  // === State Flags ===
  isIdle: boolean;
  isLoading: boolean;
  isValidating: boolean;
  isReady: boolean;
  isSubmitting: boolean;
  isPaymentPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // === Error Info ===
  errorReason: string | null;
  errorMessage: string | null;
  canRetry: boolean;
  retryCount: number;
  
  // === Loaded Data ===
  checkout: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['checkout'];
  product: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['product'];
  offer: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['offer'];
  orderBumps: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['orderBumps'];
  affiliate: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['affiliate'];
  design: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['design'];
  resolvedGateways: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['resolvedGateways'];
  
  // === Form State ===
  formData: FormData;
  formErrors: ReturnType<typeof checkoutPublicMachine.getInitialSnapshot>['context']['formErrors'];
  selectedBumps: string[];
  appliedCoupon: CouponData | null;
  selectedPaymentMethod: 'pix' | 'credit_card';
  
  // === Payment State ===
  orderId: string | null;
  accessToken: string | null;
  paymentData: PaymentData | null;
  navigationData: NavigationData | null;
  
  // === Actions ===
  load: (slug: string, affiliateCode?: string) => void;
  retry: () => void;
  giveUp: () => void;
  updateField: (field: keyof FormData, value: string) => void;
  updateMultipleFields: (fields: Partial<FormData>) => void;
  toggleBump: (bumpId: string) => void;
  setPaymentMethod: (method: 'pix' | 'credit_card') => void;
  applyCoupon: (coupon: CouponData) => void;
  removeCoupon: () => void;
  submit: (snapshot?: Partial<FormData>, cardData?: CardFormData) => void;
  notifyPaymentSuccess: (orderId: string, paymentData: PaymentData, navigationData: NavigationData) => void;
  notifyPaymentError: (error: string) => void;
  notifyPaymentConfirmed: () => void;
  notifyPaymentFailed: (error: string) => void;
  notifyPaymentTimeout: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useCheckoutPublicMachine(): UseCheckoutPublicMachineReturn {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [state, send] = useMachine(checkoutPublicMachine);
  
  // Auto-load when slug is available and machine is idle
  useEffect(() => {
    if (slug && state.matches("idle")) {
      const affiliateCode = searchParams.get("ref") || getAffiliateCode() || undefined;
      send({ type: "LOAD", slug, affiliateCode });
    }
  }, [slug, state.value, send, searchParams]);
  
  // === State Flags ===
  const isIdle = state.matches("idle");
  const isLoading = state.matches("loading");
  const isValidating = state.matches("validating");
  const isReady = state.matches("ready") || state.matches({ ready: "form" });
  const isSubmitting = state.matches("submitting");
  const isPaymentPending = state.matches("paymentPending");
  const isSuccess = state.matches("success");
  const isError = state.matches("error");
  
  // === Error Info ===
  const errorReason = state.context.error?.reason || null;
  const errorMessage = state.context.error?.message || null;
  const canRetry = state.can({ type: "RETRY" });
  const retryCount = state.context.retryCount;
  
  // === Actions ===
  const load = useCallback((slug: string, affiliateCode?: string) => {
    send({ type: "LOAD", slug, affiliateCode });
  }, [send]);
  
  const retry = useCallback(() => {
    send({ type: "RETRY" });
  }, [send]);
  
  const giveUp = useCallback(() => {
    send({ type: "GIVE_UP" });
  }, [send]);
  
  const updateField = useCallback((field: keyof FormData, value: string) => {
    send({ type: "UPDATE_FIELD", field, value });
  }, [send]);
  
  const updateMultipleFields = useCallback((fields: Partial<FormData>) => {
    send({ type: "UPDATE_MULTIPLE_FIELDS", fields });
  }, [send]);
  
  const toggleBump = useCallback((bumpId: string) => {
    send({ type: "TOGGLE_BUMP", bumpId });
  }, [send]);
  
  const setPaymentMethod = useCallback((method: 'pix' | 'credit_card') => {
    send({ type: "SET_PAYMENT_METHOD", method });
  }, [send]);
  
  const applyCoupon = useCallback((coupon: CouponData) => {
    send({ type: "APPLY_COUPON", coupon });
  }, [send]);
  
  const removeCoupon = useCallback(() => {
    send({ type: "REMOVE_COUPON" });
  }, [send]);
  
  const submit = useCallback((snapshot?: Partial<FormData>, cardData?: CardFormData) => {
    send({ type: "SUBMIT", snapshot, cardData });
  }, [send]);
  
  const notifyPaymentSuccess = useCallback((orderId: string, paymentData: PaymentData, navigationData: NavigationData) => {
    send({ type: "SUBMIT_SUCCESS", orderId, paymentData, navigationData });
  }, [send]);
  
  const notifyPaymentError = useCallback((error: string) => {
    send({ type: "SUBMIT_ERROR", error });
  }, [send]);
  
  const notifyPaymentConfirmed = useCallback(() => {
    send({ type: "PAYMENT_CONFIRMED" });
  }, [send]);
  
  const notifyPaymentFailed = useCallback((error: string) => {
    send({ type: "PAYMENT_FAILED", error });
  }, [send]);
  
  const notifyPaymentTimeout = useCallback(() => {
    send({ type: "PAYMENT_TIMEOUT" });
  }, [send]);
  
  // === Return ===
  return useMemo(() => ({
    // State Flags
    isIdle,
    isLoading,
    isValidating,
    isReady,
    isSubmitting,
    isPaymentPending,
    isSuccess,
    isError,
    
    // Error Info
    errorReason,
    errorMessage,
    canRetry,
    retryCount,
    
    // Loaded Data
    checkout: state.context.checkout,
    product: state.context.product,
    offer: state.context.offer,
    orderBumps: state.context.orderBumps,
    affiliate: state.context.affiliate,
    design: state.context.design,
    resolvedGateways: state.context.resolvedGateways,
    
    // Form State
    formData: state.context.formData,
    formErrors: state.context.formErrors,
    selectedBumps: state.context.selectedBumps,
    appliedCoupon: state.context.appliedCoupon,
    selectedPaymentMethod: state.context.selectedPaymentMethod,
    
    // Payment State
    orderId: state.context.orderId,
    accessToken: state.context.accessToken,
    paymentData: state.context.paymentData,
    navigationData: state.context.navigationData,
    
    // Actions
    load,
    retry,
    giveUp,
    updateField,
    updateMultipleFields,
    toggleBump,
    setPaymentMethod,
    applyCoupon,
    removeCoupon,
    submit,
    notifyPaymentSuccess,
    notifyPaymentError,
    notifyPaymentConfirmed,
    notifyPaymentFailed,
    notifyPaymentTimeout,
  }), [
    isIdle, isLoading, isValidating, isReady, isSubmitting, isPaymentPending, isSuccess, isError,
    errorReason, errorMessage, canRetry, retryCount,
    state.context,
    load, retry, giveUp, updateField, updateMultipleFields, toggleBump,
    setPaymentMethod, applyCoupon, removeCoupon, submit,
    notifyPaymentSuccess, notifyPaymentError, notifyPaymentConfirmed, notifyPaymentFailed, notifyPaymentTimeout,
  ]);
}
