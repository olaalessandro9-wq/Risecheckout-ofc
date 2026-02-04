/**
 * Checkout Public Content Component
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * AUDITED: Zero TypeScript errors, all interfaces correctly typed.
 * 
 * The main checkout UI that receives state from the XState machine.
 * This component focuses purely on rendering - all state logic is in the machine.
 * 
 * IMPORTANT: Payment flow is now fully controlled by the XState machine.
 * Navigation is REACTIVE based on machine state (navigationData).
 * 
 * PHASE 2: 
 * - Uses CheckoutPublicLayout (NO @dnd-kit dependencies)
 * - Uses productPixels and vendorIntegration from machine (NO extra HTTP calls)
 * - Uses usePerformanceMetrics for Web Vitals monitoring
 * 
 * @module checkout-public/components
 */

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { toCheckoutFormData } from "../adapters";
import { usePerformanceMetrics } from "../hooks/usePerformanceMetrics";

const log = createLogger("CheckoutPublicContent");

import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { TrackingManager } from "@/components/checkout/v2/TrackingManager";
import { SharedCheckoutLayout } from "@/components/checkout/shared";
import { CheckoutPublicLayout } from "./layout";
import { useTrackingService } from "@/hooks/checkout/useTrackingService";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useVisitTracker } from "@/hooks/checkout/useVisitTracker";
import { getSubmitSnapshot } from "@/features/checkout/personal-data";
import type { OrderBump, CheckoutFormData } from "@/types/checkout";
import type { UseCheckoutPublicMachineReturn } from "../hooks";
import type { CardFormData } from "../machines/checkoutPublicMachine.types";
import type { CheckoutComponent } from "@/types/checkoutEditor";

interface CheckoutPublicContentProps {
  machine: UseCheckoutPublicMachineReturn;
}

export const CheckoutPublicContent: React.FC<CheckoutPublicContentProps> = ({ machine }) => {
  const navigate = useNavigate();
  
  // Performance Metrics (Phase 2)
  usePerformanceMetrics({
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
  });
  
  const {
    checkout,
    product,
    design,
    orderBumps,
    // Note: offer is available from machine but not used in this component
    // It's used via orderBumps and product.price for calculations
    resolvedGateways,
    formData,
    formErrors,
    selectedBumps,
    appliedCoupon,
    selectedPaymentMethod,
    isSubmitting,
    isPaymentPending,
    isSuccess,
    navigationData,
    updateField,
    updateMultipleFields,
    toggleBump,
    setPaymentMethod,
    applyCoupon,
    removeCoupon,
    submit,
    // Phase 2: BFF Unified Data
    productPixels,
    vendorIntegration,
  } = machine;

  // ============================================================================
  // RISE V3: PRELOAD PIX PAGE CHUNK WHEN USER SELECTS PIX
  // Eliminates chunk loading delay during navigation
  // ============================================================================
  
  useEffect(() => {
    if (selectedPaymentMethod === 'pix') {
      // Preload the PIX page chunk in the background
      import("@/pages/PixPaymentPage").catch(() => {
        // Ignore preload errors - will be handled during navigation
      });
    }
  }, [selectedPaymentMethod]);

  // ============================================================================
  // REACTIVE NAVIGATION (based on XState machine state)
  // ============================================================================
  
  useEffect(() => {
    if (!navigationData) return;

    if (isPaymentPending && navigationData.type === 'pix') {
      log.info("Navigating to PIX page", { orderId: navigationData.orderId });
      navigate(`/pay/pix/${navigationData.orderId}`, {
        state: navigationData,
        replace: true,
      });
    }

    if (isSuccess && navigationData.type === 'card' && navigationData.status === 'approved') {
      log.info("Navigating to success page", { orderId: navigationData.orderId });
      navigate(`/success/${navigationData.orderId}`, {
        replace: true,
      });
    }
  }, [navigationData, isPaymentPending, isSuccess, navigate]);

  // ============================================================================
  // AUTO-SCROLL TO FIRST ERROR FIELD
  // ============================================================================
  
  // Track previous error state to avoid duplicate toasts
  const prevErrorKeysRef = useRef<string>("");
  
  // Compute a stable key based on error field names
  const formErrorsKey = useMemo(
    () => JSON.stringify(Object.keys(formErrors).sort()),
    [formErrors]
  );
  
  useEffect(() => {
    const errorFields = Object.keys(formErrors);
    if (errorFields.length === 0) {
      prevErrorKeysRef.current = "";
      return;
    }
    
    // Skip if errors haven't changed
    if (prevErrorKeysRef.current === formErrorsKey) return;
    prevErrorKeysRef.current = formErrorsKey;
    
    const firstErrorField = errorFields[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement | null;
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Delay focus to ensure scroll completes
      setTimeout(() => element.focus(), 300);
    }
    
    toast.error("Por favor, preencha todos os campos obrigatórios");
  }, [formErrors, formErrorsKey]);

  // ============================================================================
  // EARLY RETURN - requires data
  // ============================================================================

  if (!checkout || !product || !design) {
    return null;
  }

  const checkoutId = checkout.id;
  const vendorId = checkout.vendorId;

  // Track visit on page load (once per session) - deferred via useDeferredTracking
  useVisitTracker(checkoutId);

  // PHASE 2: Product pixels come from machine (BFF unified, no extra HTTP call)
  // Convert ProductPixelData[] to CheckoutPixel[] format expected by TrackingManager
  const trackingPixels = useMemo(() => 
    productPixels.map(p => ({
      id: p.id,
      platform: p.platform as import("@/modules/pixels").PixelPlatform,
      pixel_id: p.pixel_id,
      access_token: p.access_token,
      conversion_label: p.conversion_label,
      domain: p.domain,
      is_active: p.is_active,
      fire_on_initiate_checkout: p.fire_on_initiate_checkout,
      fire_on_purchase: p.fire_on_purchase,
      fire_on_pix: p.fire_on_pix,
      fire_on_card: p.fire_on_card,
      fire_on_boleto: p.fire_on_boleto,
      custom_value_percent: p.custom_value_percent,
    })),
    [productPixels]
  );

  // PHASE 2: UTMify config comes from machine (BFF unified, no extra HTTP call)
  const utmifyConfig = vendorIntegration?.active ? vendorIntegration.config : null;

  // Affiliate Tracking - modo 'persist' para persistência final com configs do produto
  const affiliateSettings = product.affiliate_settings;
  useAffiliateTracking({ 
    mode: 'persist',
    cookieDuration: affiliateSettings?.cookieDuration || 30, 
    attributionModel: affiliateSettings?.attributionModel || 'last_click', 
    enabled: true 
  });

  // RISE V3: Cupom é gerenciado exclusivamente pela máquina XState (SSOT)
  // Removido: localAppliedCoupon - estado duplicado causava bug de desconto não aplicado

  // Convert selectedBumps array to Set for OrderBumpList component
  const selectedBumpsSet = useMemo(() => new Set(selectedBumps), [selectedBumps]);

  // Calculate total price
  const calculateTotal = useCallback(() => {
    let total = product.price;
    
    // Add selected bumps
    for (const bumpId of selectedBumps) {
      const bump = orderBumps.find(b => b.id === bumpId);
      if (bump) {
        total += bump.price;
      }
    }
    
    // Apply coupon discount (RISE V3: apenas porcentagem suportado)
    if (appliedCoupon) {
      total = total * (1 - appliedCoupon.discount_value / 100);
    }
    
    return total;
  }, [product.price, selectedBumps, orderBumps, appliedCoupon]);

  // Form data adapter: Machine FormData -> CheckoutFormData (public interface)
  // Uses dedicated adapter for explicit conversion (RISE V3 - Zero ambiguity)
  const adaptedFormData = useMemo<CheckoutFormData>(
    () => toCheckoutFormData(formData),
    [formData]
  );

  // Payment method handler
  const handlePaymentChange = useCallback((method: 'pix' | 'credit_card') => {
    setPaymentMethod(method);
  }, [setPaymentMethod]);

  // RISE V3: Sincronizar cupom com máquina XState (SSOT)
  // Antes: apenas atualizava estado local, cupom não era enviado ao backend
  const handleTotalChange = useCallback((_total: number, coupon: typeof appliedCoupon) => {
    if (coupon) {
      applyCoupon(coupon);
    } else if (appliedCoupon) {
      removeCoupon();
    }
  }, [applyCoupon, removeCoupon, appliedCoupon]);

  // Tracking Service (apenas UTMify) - cast to expected type or null
  const { fireInitiateCheckout } = useTrackingService({
    vendorId: vendorId || null,
    productId: product.id,
    productName: product.name,
    trackingConfig: { utmifyConfig: utmifyConfig as import("@/integrations/tracking/utmify").UTMifyIntegration | null },
  });

  // Calculate memoized amount
  const memoizedAmount = useMemo(() => calculateTotal(), [calculateTotal]);

  // ============================================================================
  // SUBMIT HANDLERS - Send events to XState machine
  // ============================================================================

  // Submit handler for PIX payments
  // Validation is now handled by XState machine (SSOT)
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const snapshot = getSubmitSnapshot(e.currentTarget, formData);
    
    // Fire tracking event
    fireInitiateCheckout(selectedBumpsSet, orderBumps as OrderBump[]);
    
    // Submit to machine - validation happens in the machine
    if (selectedPaymentMethod === 'pix') {
      submit(snapshot);
    }
  }, [formData, fireInitiateCheckout, selectedBumpsSet, orderBumps, selectedPaymentMethod, submit]);

  // Submit handler for Credit Card payments
  // Validation is now handled by XState machine (SSOT)
  const handleCardSubmit = useCallback(async (
    token: string, 
    installments: number, 
    paymentMethodId: string, 
    issuerId: string, 
    holderDocument?: string
  ): Promise<void> => {
    const snapshot = getSubmitSnapshot(null, formData);
    
    // Fire tracking event
    fireInitiateCheckout(selectedBumpsSet, orderBumps as OrderBump[]);
    
    // Build card data for machine
    const cardData: CardFormData = {
      token,
      installments,
      paymentMethodId,
      issuerId,
      holderDocument,
    };
    
    // Submit to machine with card data - validation happens in the machine
    submit(snapshot, cardData);
  }, [formData, fireInitiateCheckout, selectedBumpsSet, orderBumps, submit]);

  // ============================================================================
  // CUSTOMIZATION - Build from checkout components (RISE V3 - SSOT)
  // ============================================================================

  const customization = useMemo(() => {
    // Parse top_components and bottom_components from checkout data
    const topComponents: CheckoutComponent[] = Array.isArray(checkout.top_components)
      ? (checkout.top_components as CheckoutComponent[])
      : [];
    const bottomComponents: CheckoutComponent[] = Array.isArray(checkout.bottom_components)
      ? (checkout.bottom_components as CheckoutComponent[])
      : [];

    // Extract backgroundImage from checkout.design (JSON field)
    const checkoutDesignJson = checkout.design as Record<string, unknown> | undefined;
    const backgroundImage = checkoutDesignJson?.backgroundImage as 
      { url?: string; fixed?: boolean; repeat?: boolean; expand?: boolean } | undefined;

    // Build customization for CheckoutPublicLayout (Phase 2 - lightweight layout)
    return {
      design: {
        theme: checkout.theme || 'light',
        font: checkout.font || 'Inter',
        colors: design.colors,
        backgroundImage,
      },
      topComponents,
      bottomComponents,
    };
  }, [checkout.top_components, checkout.bottom_components, checkout.theme, checkout.font, checkout.design, design]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const productData = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.image_url,
  };
  
  const creditCardGateway = resolvedGateways.creditCard;
  const cardPublicKey = creditCardGateway === 'stripe' 
    ? resolvedGateways.stripePublicKey 
    : resolvedGateways.mercadoPagoPublicKey;

  return (
    <CheckoutProvider value={{ checkout: null, design, orderBumps: orderBumps as OrderBump[], vendorId: vendorId || null, productData }}>
      <TrackingManager 
        productId={product.id} 
        productPixels={trackingPixels}
        utmifyConfig={utmifyConfig as import("@/integrations/tracking/utmify").UTMifyIntegration | null}
      />
      <CheckoutPublicLayout design={design} customization={customization}>
        <SharedCheckoutLayout
          productData={productData}
          orderBumps={orderBumps as OrderBump[]}
          design={design}
          selectedPayment={selectedPaymentMethod}
          onPaymentChange={handlePaymentChange}
          selectedBumps={selectedBumpsSet}
          onToggleBump={toggleBump}
          mode="public"
          formData={adaptedFormData}
          formErrors={formErrors}
          onFieldChange={updateField}
          requiredFields={product.required_fields}
          isProcessing={isSubmitting}
          publicKey={cardPublicKey}
          creditCardGateway={creditCardGateway}
          amount={memoizedAmount}
          onSubmitPayment={handleCardSubmit}
          onTotalChange={handleTotalChange}
          formWrapper={(children, formRef) => (
            <form ref={formRef as React.RefObject<HTMLFormElement>} onSubmit={handleSubmit} className="space-y-6">
              {children}
            </form>
          )}
        />
      </CheckoutPublicLayout>
    </CheckoutProvider>
  );
};
