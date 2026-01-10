/**
 * Página: PublicCheckoutV2
 * 
 * ✅ REFATORADO (RISE ARCHITECT PROTOCOL - Dezembro 2024):
 * - Dividido em Loader (fetching) e Content (lógica)
 * - Hooks só inicializados com checkoutId garantido (elimina timing bugs)
 * - Snapshot sincroniza state após submit (evita regressão ao voltar)
 */

import React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { TrackingManager } from "@/components/checkout/v2/TrackingManager";

// Componentes Compartilhados (Single Source of Truth)
import { SharedCheckoutLayout } from "@/components/checkout/shared";
import { CheckoutMasterLayout } from "@/components/checkout/unified";

// Hooks da nova arquitetura
import { useCheckoutData } from "@/hooks/checkout/useCheckoutData";
import { useFormManager } from "@/hooks/checkout/useFormManager";
import { usePaymentOrchestrator } from "@/hooks/checkout/payment/usePaymentOrchestrator";
import { useTrackingService } from "@/hooks/checkout/useTrackingService";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useTurnstileVerification } from "@/hooks/checkout/useTurnstileVerification";

// Personal Data Domain (Snapshot para resolver autofill)
import {
  getSubmitSnapshot,
  requiredFieldsToArray,
  parseRequiredFields,
} from "@/features/checkout/personal-data";

// Tracking Configs
import * as Facebook from "@/integrations/tracking/facebook";
import * as UTMify from "@/integrations/tracking/utmify";
import * as GoogleAds from "@/integrations/tracking/google-ads";
import * as TikTok from "@/integrations/tracking/tiktok";
import * as Kwai from "@/integrations/tracking/kwai";

// Types from checkout domain
import type { OrderBump, CheckoutDesign } from "@/types/checkout";

// ============================================================================
// LOADER COMPONENT (Boundary que busca dados)
// ============================================================================

const PublicCheckoutV2: React.FC = () => {
  const { checkout, design, orderBumps, isLoading, isError } = useCheckoutData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !checkout || !design || !checkout.product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout não encontrado</h1>
          <p className="text-gray-600">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  // ✅ Dados garantidos - renderiza Content com props tipadas
  // Casting para garantir ao TS que checkout.product existe
  const validatedCheckout = checkout as typeof checkout & { 
    product: NonNullable<typeof checkout.product> 
  };

  return (
    <PublicCheckoutV2Content
      checkout={validatedCheckout}
      design={design}
      orderBumps={orderBumps || []}
    />
  );
};

// ============================================================================
// CONTENT COMPONENT (Lógica com checkoutId garantido)
// ============================================================================

interface ContentProps {
  checkout: NonNullable<ReturnType<typeof useCheckoutData>["checkout"]> & { 
    product: NonNullable<NonNullable<ReturnType<typeof useCheckoutData>["checkout"]>["product"]> 
  };
  design: NonNullable<ReturnType<typeof useCheckoutData>["design"]>;
  orderBumps: OrderBump[];
}

const PublicCheckoutV2Content: React.FC<ContentProps> = ({
  checkout,
  design,
  orderBumps,
}) => {
  // ✅ checkoutId SEMPRE disponível aqui (garantido pelo Loader)
  const checkoutId = checkout.id;

  // ============================================================================
  // AFFILIATE TRACKING
  // ============================================================================
  
  const affiliateSettings = checkout.product.affiliate_settings as {
    cookieDuration?: number;
    attributionModel?: 'last_click' | 'first_click' | 'linear';
  } | undefined;

  useAffiliateTracking({
    cookieDuration: affiliateSettings?.cookieDuration || 30,
    attributionModel: affiliateSettings?.attributionModel || 'last_click',
    enabled: true,
  });

  // ============================================================================
  // TRACKING CONFIGS
  // ============================================================================
  
  const { data: fbConfig } = Facebook.useFacebookConfig(checkoutId);
  const { data: utmifyConfig } = UTMify.useUTMifyConfig(checkoutId);
  const { data: googleAdsIntegration } = GoogleAds.useGoogleAdsConfig(checkoutId);
  const { data: tiktokIntegration } = TikTok.useTikTokConfig(checkoutId);
  const { data: kwaiIntegration } = Kwai.useKwaiConfig(checkoutId);

  // ============================================================================
  // FORM MANAGER (com checkoutId garantido)
  // ============================================================================
  
  const requiredFieldsConfig = parseRequiredFields(checkout.product.required_fields);
  const requiredFieldsArray = requiredFieldsToArray(requiredFieldsConfig);

  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    id: string;
    code: string;
    name: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    apply_to_order_bumps: boolean;
  } | null>(null);

  const {
    formData,
    formErrors,
    selectedBumps,
    isProcessing,
    updateField,
    updateMultipleFields,
    toggleBump,
    calculateTotal,
    validateForm,
    setProcessing,
  } = useFormManager({
    checkoutId, // ✅ GARANTIDO: nunca será null/undefined aqui
    requiredFields: requiredFieldsArray,
    orderBumps: orderBumps,
    productPrice: checkout.product.price,
  });

  // ============================================================================
  // PAYMENT GATEWAY
  // ============================================================================

  const {
    selectedPayment,
    setSelectedPayment,
    submitPayment,
  } = usePaymentOrchestrator({
    vendorId: null,
    checkoutId,
    productId: checkout.product.id,
    productName: checkout.product.name,
    productPrice: checkout.product.price,
    publicKey: checkout.mercadopago_public_key || null,
    amount: calculateTotal(),
    formData,
    selectedBumps,
    orderBumps,
    appliedCoupon,
    pixGateway: checkout.pix_gateway || 'pushinpay',
    creditCardGateway: checkout.credit_card_gateway || 'mercadopago',
  });

  const handleTotalChange = React.useCallback((total: number, coupon: typeof appliedCoupon) => {
    setAppliedCoupon(coupon);
  }, []);

  // ============================================================================
  // TURNSTILE (CAPTCHA) VERIFICATION
  // ============================================================================

  const {
    token: turnstileToken,
    onTokenReceived: handleTurnstileVerify,
    onWidgetError: handleTurnstileError,
    onTokenExpired: handleTurnstileExpire,
    verifyToken: verifyTurnstileToken,
  } = useTurnstileVerification();

  // ============================================================================
  // TRACKING SERVICE
  // ============================================================================

  const { fireInitiateCheckout } = useTrackingService({
    vendorId: null,
    productId: checkout.product.id,
    productName: checkout.product.name,
    trackingConfig: {
      fbConfig,
      utmifyConfig,
      googleAdsIntegration,
      tiktokIntegration,
      kwaiIntegration,
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const memoizedAmount = React.useMemo(() => calculateTotal(), [calculateTotal]);

  const handleSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    const snapshot = getSubmitSnapshot(formElement, formData);
    
    console.log("[PublicCheckoutV2] Snapshot capturado:", {
      name: snapshot.name,
      email: snapshot.email,
    });

    const validation = validateForm(snapshot);
    if (!validation.isValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios corretamente");
      return;
    }

    // ✅ Verificar Turnstile antes de processar
    const turnstileResult = await verifyTurnstileToken();
    if (!turnstileResult.success) {
      toast.error(turnstileResult.error || "Falha na verificação de segurança");
      return;
    }

    // ✅ FIX: Sincroniza state com snapshot para manter consistência
    updateMultipleFields(snapshot);

    setProcessing(true);

    try {
      fireInitiateCheckout(selectedBumps, orderBumps);

      if (selectedPayment === 'pix') {
        await submitPayment(undefined, undefined, undefined, undefined, undefined, snapshot);
      }
    } catch (error) {
      console.error("[PublicCheckoutV2] Erro ao processar pagamento:", error);
    } finally {
      setProcessing(false);
    }
  }, [formData, validateForm, updateMultipleFields, setProcessing, fireInitiateCheckout, selectedBumps, orderBumps, selectedPayment, submitPayment, verifyTurnstileToken]);

  const handleCardSubmit = React.useCallback(async (
    token: string, 
    installments: number, 
    paymentMethodId: string, 
    issuerId: string,
    holderDocument?: string
  ) => {
    const snapshot = getSubmitSnapshot(null, formData);
    
    console.log("[PublicCheckoutV2] Card snapshot capturado:", {
      name: snapshot.name,
      email: snapshot.email,
    });

    const validation = validateForm(snapshot);
    if (!validation.isValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios corretamente");
      return;
    }

    // ✅ Verificar Turnstile antes de processar
    const turnstileResult = await verifyTurnstileToken();
    if (!turnstileResult.success) {
      toast.error(turnstileResult.error || "Falha na verificação de segurança");
      return;
    }
    
    // ✅ FIX: Sincroniza state com snapshot para manter consistência
    updateMultipleFields(snapshot);

    setProcessing(true);
    try {
      fireInitiateCheckout(selectedBumps, orderBumps);
      await submitPayment(token, installments, paymentMethodId, issuerId, holderDocument, snapshot);
    } catch (error) {
      console.error("[PublicCheckoutV2] Erro ao processar cartão:", error);
    } finally {
      setProcessing(false);
    }
  }, [formData, validateForm, updateMultipleFields, setProcessing, fireInitiateCheckout, selectedBumps, orderBumps, submitPayment, verifyTurnstileToken]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const checkoutForContext = { ...checkout };

  const productData = {
    id: checkout.product.id,
    name: checkout.product.name,
    description: checkout.product.description,
    price: checkout.product.price,
    image_url: checkout.product.image_url,
  };

  const customization = {
    topComponents: checkout.top_components || [],
    bottomComponents: checkout.bottom_components || [],
  };

  const creditCardGateway = checkout.credit_card_gateway || 'mercadopago';
  const cardPublicKey = creditCardGateway === 'stripe' 
    ? checkout.stripe_public_key 
    : checkout.mercadopago_public_key;

  return (
    <CheckoutProvider value={{ checkout: checkoutForContext as any, design, orderBumps, vendorId: null }}>
      <TrackingManager
        productId={checkout.product.id}
        fbConfig={fbConfig}
        utmifyConfig={utmifyConfig}
        googleAdsIntegration={googleAdsIntegration}
        tiktokIntegration={tiktokIntegration}
        kwaiIntegration={kwaiIntegration}
      />

      <CheckoutMasterLayout
        mode="public"
        design={design}
        customization={customization as any}
        viewMode="public"
      >
        <SharedCheckoutLayout
          productData={productData}
          orderBumps={orderBumps}
          design={design}
          selectedPayment={selectedPayment}
          onPaymentChange={setSelectedPayment}
          selectedBumps={selectedBumps}
          onToggleBump={toggleBump}
          mode="public"
          formData={formData}
          formErrors={formErrors}
          onFieldChange={updateField}
          requiredFields={checkout.product.required_fields}
          isProcessing={isProcessing}
          publicKey={cardPublicKey}
          creditCardGateway={creditCardGateway}
          amount={memoizedAmount}
          onSubmitPayment={handleCardSubmit}
          onTotalChange={handleTotalChange}
          turnstileToken={turnstileToken}
          onTurnstileVerify={handleTurnstileVerify}
          onTurnstileError={handleTurnstileError}
          onTurnstileExpire={handleTurnstileExpire}
          formWrapper={(children, formRef) => (
            <form 
              ref={formRef as React.RefObject<HTMLFormElement>} 
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              {children}
            </form>
          )}
        />
      </CheckoutMasterLayout>
    </CheckoutProvider>
  );
};

export default PublicCheckoutV2;
