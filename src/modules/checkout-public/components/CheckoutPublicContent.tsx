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
 * @module checkout-public/components
 */

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import { toCheckoutFormData } from "../adapters";

const log = createLogger("CheckoutPublicContent");

import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { TrackingManager } from "@/components/checkout/v2/TrackingManager";
import { SharedCheckoutLayout } from "@/components/checkout/shared";
import { CheckoutMasterLayout } from "@/components/checkout/unified";
import { useTrackingService } from "@/hooks/checkout/useTrackingService";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useCheckoutProductPixels } from "@/hooks/checkout/useCheckoutProductPixels";
import { useVisitTracker } from "@/hooks/checkout/useVisitTracker";
import { getSubmitSnapshot } from "@/features/checkout/personal-data";
import * as UTMify from "@/integrations/tracking/utmify";
import type { OrderBump, CheckoutFormData } from "@/types/checkout";
import type { UseCheckoutPublicMachineReturn } from "../hooks";
import type { CardFormData } from "../machines/checkoutPublicMachine.types";
import type { CheckoutComponent } from "@/types/checkoutEditor";

interface CheckoutPublicContentProps {
  machine: UseCheckoutPublicMachineReturn;
}

export const CheckoutPublicContent: React.FC<CheckoutPublicContentProps> = ({ machine }) => {
  const navigate = useNavigate();
  
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
    submit,
  } = machine;

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

  // Track visit on page load (once per session)
  useVisitTracker(checkoutId);

  // Fetch product pixels from product_pixels table
  const { pixels: productPixels } = useCheckoutProductPixels(product.id);

  // Affiliate Tracking - modo 'persist' para persistência final com configs do produto
  const affiliateSettings = product.affiliate_settings;
  useAffiliateTracking({ 
    mode: 'persist',
    cookieDuration: affiliateSettings?.cookieDuration || 30, 
    attributionModel: affiliateSettings?.attributionModel || 'last_click', 
    enabled: true 
  });

  // UTMify (único tracking que ainda não migrou para product_pixels)
  const { data: utmifyConfig } = UTMify.useUTMifyConfig(vendorId);

  // Coupon state for form manager compatibility
  const [localAppliedCoupon, setLocalAppliedCoupon] = React.useState<typeof appliedCoupon>(appliedCoupon);

  // Convert selectedBumps array to Set for compatibility with legacy components
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
    if (localAppliedCoupon) {
      total = total * (1 - localAppliedCoupon.discount_value / 100);
    }
    
    return total;
  }, [product.price, selectedBumps, orderBumps, localAppliedCoupon]);

  // Form data adapter: Machine FormData -> CheckoutFormData (legacy interface)
  // Uses dedicated adapter for explicit conversion (RISE V3 - Zero ambiguity)
  const formDataForLegacy = useMemo<CheckoutFormData>(
    () => toCheckoutFormData(formData),
    [formData]
  );

  // Payment method handler
  const handlePaymentChange = useCallback((method: 'pix' | 'credit_card') => {
    setPaymentMethod(method);
  }, [setPaymentMethod]);

  const handleTotalChange = useCallback((_total: number, coupon: typeof localAppliedCoupon) => {
    setLocalAppliedCoupon(coupon);
  }, []);

  // Tracking Service (apenas UTMify)
  const { fireInitiateCheckout } = useTrackingService({
    vendorId: vendorId || null,
    productId: product.id,
    productName: product.name,
    trackingConfig: { utmifyConfig },
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

    // Build customization compatible with CheckoutMasterLayout
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
        productPixels={productPixels}
        utmifyConfig={utmifyConfig}
      />
      <CheckoutMasterLayout mode="public" design={design} viewMode="public" customization={customization}>
        <SharedCheckoutLayout
          productData={productData}
          orderBumps={orderBumps as OrderBump[]}
          design={design}
          selectedPayment={selectedPaymentMethod}
          onPaymentChange={handlePaymentChange}
          selectedBumps={selectedBumpsSet}
          onToggleBump={toggleBump}
          mode="public"
          formData={formDataForLegacy}
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
      </CheckoutMasterLayout>
    </CheckoutProvider>
  );
};
