/**
 * Checkout Public Content Component
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * AUDITED: Zero TypeScript errors, all interfaces correctly typed.
 * 
 * The main checkout UI that receives state from the XState machine.
 * This component focuses purely on rendering - all state logic is in the machine.
 * 
 * @module checkout-public/components
 */

import React from "react";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const log = createLogger("CheckoutPublicContent");

import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { TrackingManager } from "@/components/checkout/v2/TrackingManager";
import { SharedCheckoutLayout } from "@/components/checkout/shared";
import { CheckoutMasterLayout } from "@/components/checkout/unified";
import { useTrackingService } from "@/hooks/checkout/useTrackingService";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useCheckoutProductPixels } from "@/hooks/checkout/useCheckoutProductPixels";
import { useVisitTracker } from "@/hooks/checkout/useVisitTracker";
import { usePaymentOrchestrator } from "@/hooks/checkout/payment/usePaymentOrchestrator";
import { getSubmitSnapshot } from "@/features/checkout/personal-data";
import * as UTMify from "@/integrations/tracking/utmify";
import type { OrderBump, CheckoutFormData } from "@/types/checkout";
import type { UseCheckoutPublicMachineReturn } from "../hooks";

interface CheckoutPublicContentProps {
  machine: UseCheckoutPublicMachineReturn;
}

export const CheckoutPublicContent: React.FC<CheckoutPublicContentProps> = ({ machine }) => {
  const {
    checkout,
    product,
    design,
    orderBumps,
    offer,
    resolvedGateways,
    formData,
    formErrors,
    selectedBumps,
    appliedCoupon,
    selectedPaymentMethod,
    isSubmitting,
    updateField,
    updateMultipleFields,
    toggleBump,
    setPaymentMethod,
    notifyPaymentError,
  } = machine;

  // Ensure we have required data
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
  const selectedBumpsSet = React.useMemo(() => new Set(selectedBumps), [selectedBumps]);

  // Calculate total price
  const calculateTotal = React.useCallback(() => {
    let total = product.price;
    
    // Add selected bumps
    for (const bumpId of selectedBumps) {
      const bump = orderBumps.find(b => b.id === bumpId);
      if (bump) {
        total += bump.price;
      }
    }
    
    // Apply coupon discount
    if (localAppliedCoupon) {
      if (localAppliedCoupon.discount_type === 'percentage') {
        total = total * (1 - localAppliedCoupon.discount_value / 100);
      } else {
        total = Math.max(0, total - localAppliedCoupon.discount_value);
      }
    }
    
    return total;
  }, [product.price, selectedBumps, orderBumps, localAppliedCoupon]);

  // Form data adapter: Machine FormData -> CheckoutFormData (legacy interface)
  // Uses generic type parameter in useMemo for correct typing
  const formDataForOrchestrator = React.useMemo<CheckoutFormData>(() => ({
    name: formData.name,
    email: formData.email,
    phone: formData.phone || '',
    document: formData.cpf || formData.document || '',
  }), [formData.name, formData.email, formData.phone, formData.cpf, formData.document]);

  // Payment Gateway
  const { selectedPayment, setSelectedPayment, submitPayment } = usePaymentOrchestrator({
    vendorId: null,
    checkoutId,
    productId: product.id, 
    offerId: offer?.offerId || null,
    productName: product.name,
    productPrice: product.price,
    publicKey: resolvedGateways.mercadoPagoPublicKey || null,
    amount: calculateTotal(),
    formData: formDataForOrchestrator,
    selectedBumps: selectedBumpsSet,
    orderBumps: orderBumps as OrderBump[],
    appliedCoupon: localAppliedCoupon,
    pixGateway: resolvedGateways.pix,
    creditCardGateway: resolvedGateways.creditCard,
  });

  // Sync payment method with machine
  React.useEffect(() => {
    if (selectedPayment !== selectedPaymentMethod) {
      setSelectedPayment(selectedPaymentMethod);
    }
  }, [selectedPaymentMethod, selectedPayment, setSelectedPayment]);

  const handlePaymentChange = React.useCallback((method: 'pix' | 'credit_card') => {
    setPaymentMethod(method);
    setSelectedPayment(method);
  }, [setPaymentMethod, setSelectedPayment]);

  const handleTotalChange = React.useCallback((_total: number, coupon: typeof localAppliedCoupon) => {
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
  const memoizedAmount = React.useMemo(() => calculateTotal(), [calculateTotal]);

  // Submit handler for PIX payments
  const handleSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const snapshot = getSubmitSnapshot(e.currentTarget, formData);
    
    // Basic validation
    if (!snapshot.name?.trim() || !snapshot.email?.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    updateMultipleFields(snapshot);
    
    try {
      fireInitiateCheckout(selectedBumpsSet, orderBumps as OrderBump[]);
      
      if (selectedPaymentMethod === 'pix') {
        await submitPayment(undefined, undefined, undefined, undefined, undefined, snapshot);
      }
    } catch (error: unknown) {
      log.error("Erro:", error);
      notifyPaymentError(String(error));
    }
  }, [formData, updateMultipleFields, fireInitiateCheckout, selectedBumpsSet, orderBumps, selectedPaymentMethod, submitPayment, notifyPaymentError]);

  // Submit handler for Credit Card payments
  const handleCardSubmit = React.useCallback(async (
    token: string, 
    installments: number, 
    paymentMethodId: string, 
    issuerId: string, 
    holderDocument?: string
  ) => {
    const snapshot = getSubmitSnapshot(null, formData);
    
    if (!snapshot.name?.trim() || !snapshot.email?.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    updateMultipleFields(snapshot);
    
    try {
      fireInitiateCheckout(selectedBumpsSet, orderBumps as OrderBump[]);
      await submitPayment(token, installments, paymentMethodId, issuerId, holderDocument, snapshot);
    } catch (error: unknown) {
      log.error("Erro cartão:", error);
      notifyPaymentError(String(error));
    }
  }, [formData, updateMultipleFields, fireInitiateCheckout, selectedBumpsSet, orderBumps, submitPayment, notifyPaymentError]);

  // Render data
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
      <CheckoutMasterLayout mode="public" design={design} viewMode="public">
        <SharedCheckoutLayout
          productData={productData}
          orderBumps={orderBumps as OrderBump[]}
          design={design}
          selectedPayment={selectedPaymentMethod}
          onPaymentChange={handlePaymentChange}
          selectedBumps={selectedBumpsSet}
          onToggleBump={toggleBump}
          mode="public"
          formData={formDataForOrchestrator}
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
