/**
 * PublicCheckoutV2Content
 * 
 * Componente de conteúdo do checkout público.
 * Separado do Loader para respeitar o limite de 300 linhas.
 */

import React from "react";
import { toast } from "sonner";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { TrackingManager } from "@/components/checkout/v2/TrackingManager";
import { SharedCheckoutLayout } from "@/components/checkout/shared";
import { CheckoutMasterLayout } from "@/components/checkout/unified";
import { useFormManager } from "@/hooks/checkout/useFormManager";
import { usePaymentOrchestrator } from "@/hooks/checkout/payment/usePaymentOrchestrator";
import { useTrackingService } from "@/hooks/checkout/useTrackingService";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useTurnstileVerification } from "@/hooks/checkout/useTurnstileVerification";
import { useCheckoutProductPixels } from "@/hooks/checkout/useCheckoutProductPixels";
import { getSubmitSnapshot, requiredFieldsToArray, parseRequiredFields } from "@/features/checkout/personal-data";
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
import * as GoogleAds from "@/integrations/tracking/google-ads";
import * as TikTok from "@/integrations/tracking/tiktok";
import * as Kwai from "@/integrations/tracking/kwai";
import type { OrderBump } from "@/types/checkout";
import type { useCheckoutData } from "@/hooks/checkout/useCheckoutData";

interface ContentProps {
  checkout: NonNullable<ReturnType<typeof useCheckoutData>["checkout"]> & { 
    product: NonNullable<NonNullable<ReturnType<typeof useCheckoutData>["checkout"]>["product"]> 
  };
  design: NonNullable<ReturnType<typeof useCheckoutData>["design"]>;
  orderBumps: OrderBump[];
}

export const PublicCheckoutV2Content: React.FC<ContentProps> = ({ checkout, design, orderBumps }) => {
  const checkoutId = checkout.id;
  const vendorId = (checkout as any).vendorId as string | undefined;

  // NEW: Fetch product pixels from product_pixels table
  const { pixels: productPixels } = useCheckoutProductPixels(checkout.product.id);

  // Affiliate Tracking
  const affiliateSettings = checkout.product.affiliate_settings as { cookieDuration?: number; attributionModel?: 'last_click' | 'first_click' | 'linear' } | undefined;
  useAffiliateTracking({ cookieDuration: affiliateSettings?.cookieDuration || 30, attributionModel: affiliateSettings?.attributionModel || 'last_click', enabled: true });

  // Legacy Tracking Configs (fallback if no product_pixels)
  const { data: fbConfig } = Facebook.useFacebookConfig(vendorId);
  const { data: utmifyConfig } = UTMify.useUTMifyConfig(vendorId);
  const { data: googleAdsIntegration } = GoogleAds.useGoogleAdsConfig(vendorId);
  const { data: tiktokIntegration } = TikTok.useTikTokConfig(vendorId);
  const { data: kwaiIntegration } = Kwai.useKwaiConfig(vendorId);

  // Form Manager
  const requiredFieldsConfig = parseRequiredFields(checkout.product.required_fields);
  const requiredFieldsArray = requiredFieldsToArray(requiredFieldsConfig);
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ id: string; code: string; name: string; discount_type: "percentage" | "fixed"; discount_value: number; apply_to_order_bumps: boolean } | null>(null);

  const { formData, formErrors, selectedBumps, isProcessing, updateField, updateMultipleFields, toggleBump, calculateTotal, validateForm, setProcessing } = useFormManager({
    checkoutId, requiredFields: requiredFieldsArray, orderBumps, productPrice: checkout.product.price,
  });

  // Payment Gateway
  const { selectedPayment, setSelectedPayment, submitPayment } = usePaymentOrchestrator({
    vendorId: null, checkoutId, productId: checkout.product.id, productName: checkout.product.name, productPrice: checkout.product.price,
    publicKey: checkout.mercadopago_public_key || null, amount: calculateTotal(), formData, selectedBumps, orderBumps, appliedCoupon,
    pixGateway: checkout.pix_gateway || 'pushinpay', creditCardGateway: checkout.credit_card_gateway || 'mercadopago',
  });

  const handleTotalChange = React.useCallback((total: number, coupon: typeof appliedCoupon) => { setAppliedCoupon(coupon); }, []);

  // Turnstile
  const { token: turnstileToken, onTokenReceived: handleTurnstileVerify, onWidgetError: handleTurnstileError, onTokenExpired: handleTurnstileExpire, verifyToken: verifyTurnstileToken } = useTurnstileVerification();

  // Tracking Service
  const { fireInitiateCheckout } = useTrackingService({
    vendorId: vendorId || null, productId: checkout.product.id, productName: checkout.product.name,
    trackingConfig: { fbConfig, utmifyConfig, googleAdsIntegration, tiktokIntegration, kwaiIntegration },
  });

  // Handlers
  const memoizedAmount = React.useMemo(() => calculateTotal(), [calculateTotal]);

  const handleSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const snapshot = getSubmitSnapshot(e.currentTarget, formData);
    const validation = validateForm(snapshot);
    if (!validation.isValid) { toast.error("Por favor, preencha todos os campos obrigatórios corretamente"); return; }
    const turnstileResult = await verifyTurnstileToken();
    if (!turnstileResult.success) { toast.error(turnstileResult.error || "Falha na verificação de segurança"); return; }
    updateMultipleFields(snapshot);
    setProcessing(true);
    try {
      fireInitiateCheckout(selectedBumps, orderBumps);
      if (selectedPayment === 'pix') await submitPayment(undefined, undefined, undefined, undefined, undefined, snapshot);
    } catch (error) { console.error("[PublicCheckoutV2] Erro:", error); }
    finally { setProcessing(false); }
  }, [formData, validateForm, updateMultipleFields, setProcessing, fireInitiateCheckout, selectedBumps, orderBumps, selectedPayment, submitPayment, verifyTurnstileToken]);

  const handleCardSubmit = React.useCallback(async (token: string, installments: number, paymentMethodId: string, issuerId: string, holderDocument?: string) => {
    const snapshot = getSubmitSnapshot(null, formData);
    const validation = validateForm(snapshot);
    if (!validation.isValid) { toast.error("Por favor, preencha todos os campos obrigatórios corretamente"); return; }
    const turnstileResult = await verifyTurnstileToken();
    if (!turnstileResult.success) { toast.error(turnstileResult.error || "Falha na verificação de segurança"); return; }
    updateMultipleFields(snapshot);
    setProcessing(true);
    try {
      fireInitiateCheckout(selectedBumps, orderBumps);
      await submitPayment(token, installments, paymentMethodId, issuerId, holderDocument, snapshot);
    } catch (error) { console.error("[PublicCheckoutV2] Erro cartão:", error); }
    finally { setProcessing(false); }
  }, [formData, validateForm, updateMultipleFields, setProcessing, fireInitiateCheckout, selectedBumps, orderBumps, submitPayment, verifyTurnstileToken]);

  // Render
  const productData = { id: checkout.product.id, name: checkout.product.name, description: checkout.product.description, price: checkout.product.price, image_url: checkout.product.image_url };
  const customization = { topComponents: checkout.top_components || [], bottomComponents: checkout.bottom_components || [] };
  const creditCardGateway = checkout.credit_card_gateway || 'mercadopago';
  const cardPublicKey = creditCardGateway === 'stripe' ? checkout.stripe_public_key : checkout.mercadopago_public_key;

  return (
    <CheckoutProvider value={{ checkout: checkout as any, design, orderBumps, vendorId: vendorId || null }}>
      <TrackingManager 
        productId={checkout.product.id} 
        productPixels={productPixels}
        fbConfig={fbConfig} 
        utmifyConfig={utmifyConfig} 
        googleAdsIntegration={googleAdsIntegration} 
        tiktokIntegration={tiktokIntegration} 
        kwaiIntegration={kwaiIntegration} 
      />
      <CheckoutMasterLayout mode="public" design={design} customization={customization as any} viewMode="public">
        <SharedCheckoutLayout productData={productData} orderBumps={orderBumps} design={design} selectedPayment={selectedPayment} onPaymentChange={setSelectedPayment}
          selectedBumps={selectedBumps} onToggleBump={toggleBump} mode="public" formData={formData} formErrors={formErrors} onFieldChange={updateField}
          requiredFields={checkout.product.required_fields} isProcessing={isProcessing} publicKey={cardPublicKey} creditCardGateway={creditCardGateway}
          amount={memoizedAmount} onSubmitPayment={handleCardSubmit} onTotalChange={handleTotalChange} turnstileToken={turnstileToken}
          onTurnstileVerify={handleTurnstileVerify} onTurnstileError={handleTurnstileError} onTurnstileExpire={handleTurnstileExpire}
          formWrapper={(children, formRef) => <form ref={formRef as React.RefObject<HTMLFormElement>} onSubmit={handleSubmit} className="space-y-6">{children}</form>} />
      </CheckoutMasterLayout>
    </CheckoutProvider>
  );
};
