/**
 * Página: PublicCheckoutV2
 * 
 * Responsabilidade Única: Renderizar o layout do checkout público.
 * 
 * ✅ REFATORADO: Agora usa CheckoutMasterLayout (Single Source of Truth)
 * - Garantia de consistência visual com Builder e Preview
 * - Mantém toda a lógica de negócio intacta (hooks, validação, pagamento)
 * - Estrutura de página unificada em 1 único componente
 * 
 * ✅ FIX AUTOFILL: Usa DOM snapshot no submit para resolver problema
 * de autofill onde campos aparecem preenchidos mas state está vazio.
 */

import React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import { TrackingManager } from "@/components/checkout/v2/TrackingManager";
import { SecurityBadges } from "@/components/checkout/SecurityBadges";

// Componentes Compartilhados (Single Source of Truth)
import {
  SharedCheckoutLayout,
} from "@/components/checkout/shared";
import { CheckoutMasterLayout } from "@/components/checkout/unified";

// Hooks da nova arquitetura
import { useCheckoutData } from "@/hooks/checkout/useCheckoutData";
import { useFormManager } from "@/hooks/checkout/useFormManager";
import { usePaymentGateway } from "@/hooks/checkout/usePaymentGateway";
import { useTrackingService } from "@/hooks/checkout/useTrackingService";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";

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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PublicCheckoutV2: React.FC = () => {
  // ============================================================================
  // 1. CAMADA DE DADOS
  // ============================================================================

  const { checkout, design, orderBumps, isLoading, isError } = useCheckoutData();

  // ============================================================================
  // TRACKING DE AFILIADOS (com configurações do produtor)
  // ============================================================================
  // Busca as configurações de afiliação do produto e passa para o hook
  const affiliateSettings = checkout?.product?.affiliate_settings as {
    cookieDuration?: number;
    attributionModel?: 'last_click' | 'first_click' | 'linear';
  } | undefined;

  useAffiliateTracking({
    cookieDuration: affiliateSettings?.cookieDuration || 30,
    attributionModel: affiliateSettings?.attributionModel || 'last_click',
    enabled: !isLoading && !!checkout?.product, // Aguarda dados carregarem
  });

  // ✅ SEGURANÇA: Tracking configs usam checkout.id - vendorId não é mais exposto
  const checkoutId = checkout?.id || undefined;
  
  // Configurações de Tracking
  const { data: fbConfig } = Facebook.useFacebookConfig(checkoutId);
  const { data: utmifyConfig } = UTMify.useUTMifyConfig(checkoutId);
  const { data: googleAdsIntegration } = GoogleAds.useGoogleAdsConfig(checkoutId);
  const { data: tiktokIntegration } = TikTok.useTikTokConfig(checkoutId);
  const { data: kwaiIntegration } = Kwai.useKwaiConfig(checkoutId);
  
  // ✅ REFATORADO: Public key agora vem direto do checkout (desnormalizado)
  // Não precisa mais buscar vendor_integrations (evita problema de RLS)

  // ============================================================================
  // 2. CAMADA DE LÓGICA (HOOKS DE SERVIÇO)
  // ============================================================================

  // Converte required_fields para array tipado usando domain helpers
  const requiredFieldsConfig = parseRequiredFields(checkout?.product?.required_fields);
  const requiredFieldsArray = requiredFieldsToArray(requiredFieldsConfig);

  // Estado para cupom aplicado (gerenciado pelo OrderSummary)
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
    requiredFields: requiredFieldsArray,
    orderBumps: orderBumps || [],
    productPrice: checkout?.product?.price || 0, // Já está em centavos
  });

  const {
    selectedPayment,
    setSelectedPayment,
    isSDKLoaded,
    showPixPayment,
    orderId,
    submitPayment,
  } = usePaymentGateway({
    vendorId: null, // ✅ SEGURANÇA: Backend resolve via checkout_id
    checkoutId: checkout?.id || null,
    productId: checkout?.product?.id || null,
    productName: checkout?.product?.name || null,
    productPrice: checkout?.product?.price || 0,
    publicKey: checkout?.mercadopago_public_key || null,
    amount: calculateTotal(),
    formData,
    selectedBumps,
    orderBumps: orderBumps || [],
    // NOVO: Cupom aplicado
    appliedCoupon,
    // GATEWAYS CONFIGURADOS PELO VENDEDOR
    pixGateway: checkout?.pix_gateway || 'pushinpay',
    creditCardGateway: checkout?.credit_card_gateway || 'mercadopago',
  });

  // Handler para quando o OrderSummary atualiza o total/cupom
  const handleTotalChange = React.useCallback((total: number, coupon: typeof appliedCoupon) => {
    setAppliedCoupon(coupon);
  }, []);

  const { fireInitiateCheckout, firePurchase } = useTrackingService({
    vendorId: null, // ✅ SEGURANÇA: Backend resolve via checkout_id se necessário
    productId: checkout?.product?.id || null,
    productName: checkout?.product?.name || null,
    trackingConfig: {
      fbConfig,
      utmifyConfig,
      googleAdsIntegration,
      tiktokIntegration,
      kwaiIntegration,
    },
  });

  // ============================================================================
  // 3. HANDLERS (MEMOIZADOS para evitar re-renders)
  // ============================================================================

  // Memoizar amount para evitar recálculos em cada render
  const memoizedAmount = React.useMemo(() => calculateTotal(), [calculateTotal]);

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ FIX AUTOFILL: Lê dados do DOM via fallback (readAllFieldsFromDOM)
    const snapshot = getSubmitSnapshot(null, formData);
    
    // Sincroniza estado com snapshot (para garantir consistência)
    updateMultipleFields(snapshot);

    // Valida usando snapshot (não apenas state)
    const validation = validateForm(snapshot);
    if (!validation.isValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios corretamente");
      return;
    }

    setProcessing(true);

    try {
      fireInitiateCheckout(selectedBumps, orderBumps || []);

      if (selectedPayment === 'pix') {
        await submitPayment();
      }
    } catch (error) {
      console.error("[PublicCheckoutV2] Erro ao processar pagamento:", error);
    } finally {
      setProcessing(false);
    }
  }, [formData, validateForm, updateMultipleFields, setProcessing, fireInitiateCheckout, selectedBumps, orderBumps, selectedPayment, submitPayment]);

  // Handler específico para o CustomCardForm - MEMOIZADO
  const handleCardSubmit = React.useCallback(async (
    token: string, 
    installments: number, 
    paymentMethodId: string, 
    issuerId: string,
    holderDocument?: string
  ) => {
    // ✅ FIX AUTOFILL: Lê dados do DOM via fallback (readAllFieldsFromDOM)
    const snapshot = getSubmitSnapshot(null, formData);
    updateMultipleFields(snapshot);

    const validation = validateForm(snapshot);
    if (!validation.isValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios corretamente");
      return;
    }
    
    setProcessing(true);
    try {
      fireInitiateCheckout(selectedBumps, orderBumps || []);
      await submitPayment(token, installments, paymentMethodId, issuerId, holderDocument);
    } catch (error) {
      console.error("[PublicCheckoutV2] Erro ao processar cartão:", error);
    } finally {
      setProcessing(false);
    }
  }, [formData, validateForm, updateMultipleFields, setProcessing, fireInitiateCheckout, selectedBumps, orderBumps, submitPayment]);

  // ============================================================================
  // 4. RENDERIZAÇÃO CONDICIONAL (LOADING/ERROR)
  // ============================================================================

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

  // Criar objeto checkout compatível com o contexto
  // ✅ SEGURANÇA: vendor_id não é mais exposto ao cliente
  const checkoutForContext = {
    ...checkout,
  };

  // Preparar productData para componentes compartilhados
  const productData = {
    id: checkout.product.id,
    name: checkout.product.name,
    description: checkout.product.description,
    price: checkout.product.price,
    image_url: checkout.product.image_url,
  };

  // Preparar customization para o CheckoutMasterLayout
  const customization = {
    topComponents: checkout.top_components || [],
    bottomComponents: checkout.bottom_components || [],
  };

  // ============================================================================
  // 5. RENDERIZAÇÃO PRINCIPAL
  // ============================================================================

  return (
    <CheckoutProvider value={{ checkout: checkoutForContext as any, design, orderBumps: orderBumps || [], vendorId: null }}>
      {/* Scripts de Tracking - ✅ SEGURANÇA: vendorId não é mais exposto */}
      <TrackingManager
        productId={checkout.product.id}
        fbConfig={fbConfig}
        utmifyConfig={utmifyConfig}
        googleAdsIntegration={googleAdsIntegration}
        tiktokIntegration={tiktokIntegration}
        kwaiIntegration={kwaiIntegration}
      />

      {/* Layout Principal */}
      <CheckoutMasterLayout
        mode="public"
        design={design}
        customization={customization as any}
        viewMode="public"
      >
        {/* Determinar gateway e public key dinamicamente */}
        {(() => {
          const creditCardGateway = checkout?.credit_card_gateway || 'mercadopago';
          const cardPublicKey = creditCardGateway === 'stripe' 
            ? checkout?.stripe_public_key 
            : checkout?.mercadopago_public_key;
          
          return (
            <SharedCheckoutLayout
              productData={productData}
              orderBumps={orderBumps || []}
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
              // Props do Custom Form - DINÂMICO POR GATEWAY
              publicKey={cardPublicKey}
              creditCardGateway={creditCardGateway}
              amount={memoizedAmount}
              onSubmitPayment={handleCardSubmit}
              // NOVO: Callback para receber cupom aplicado
              onTotalChange={handleTotalChange}
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
          );
        })()}
      </CheckoutMasterLayout>
    </CheckoutProvider>
  );
};

export default PublicCheckoutV2;
