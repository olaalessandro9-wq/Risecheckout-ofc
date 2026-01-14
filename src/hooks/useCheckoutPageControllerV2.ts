/**
 * Hook Controller V2 (Cérebro) do Checkout Público
 * 
 * Orquestra todos os hooks V2 da nova arquitetura "Service-Oriented Hook".
 * 
 * RISE Protocol V2: Código legacy de tracking removido.
 * Apenas UTMify permanece pois não migrou para product_pixels.
 */

import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";

// Hooks V2
import { useCheckoutData } from "@/hooks/checkout/useCheckoutData";
import { useFormManager } from "@/hooks/checkout/useFormManager";
import { usePaymentOrchestrator } from "@/hooks/checkout/payment/usePaymentOrchestrator";
import { useTrackingService } from "@/hooks/checkout/useTrackingService";

// Integrações de Tracking (apenas UTMify)
import * as UTMify from "@/integrations/tracking/utmify";
import * as MercadoPago from "@/integrations/gateways/mercadopago";
import type { CouponData } from "@/types/checkout";

/** Required fields config from product */
interface RequiredFieldsConfig {
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  cpf?: boolean;
}

export const useCheckoutPageControllerV2 = () => {
  // ============================================================================
  // 1. CAMADA DE DADOS (useCheckoutData)
  // ============================================================================
  
  const { checkout, design, orderBumps, isLoading, isError } = useCheckoutData();
  
  // ============================================================================
  // 2. CONFIGURAÇÕES DE INTEGRAÇÕES
  // ============================================================================
  
  const checkoutId = checkout?.id || undefined;
  
  // UTMify (único tracking que ainda não migrou para product_pixels)
  const { data: utmifyConfig } = UTMify.useUTMifyConfig(checkoutId);
  
  // Mercado Pago
  const { data: mpIntegration } = MercadoPago.useMercadoPagoConfig(checkoutId);
  const isMpAvailable = MercadoPago.useMercadoPagoAvailable(mpIntegration);
  const mercadoPagoPublicKey = mpIntegration?.config?.public_key || "";
  
  // ============================================================================
  // 3. ESTADO LOCAL
  // ============================================================================
  
  const [selectedPayment, setSelectedPayment] = useState<'pix' | 'credit_card'>('pix');
  const [finalTotalWithDiscount, setFinalTotalWithDiscount] = useState<number | null>(null);
  const [appliedCouponData, setAppliedCouponData] = useState<CouponData | null>(null);
  
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);
  
  // ============================================================================
  // 4. HOOKS DE SERVIÇO (só inicializam se checkout estiver disponível)
  // ============================================================================
  
  // FormManager - Gerencia formulário e order bumps
  const requiredFieldsArray = getRequiredFieldsArray(checkout?.product?.required_fields);
  
  const formManager = useFormManager({
    requiredFields: requiredFieldsArray,
    orderBumps: orderBumps || [],
    productPrice: checkout?.product?.price || 0,
  });

// Helper para converter required_fields para array de strings
function getRequiredFieldsArray(requiredFields: RequiredFieldsConfig | string[] | null | undefined): string[] {
  if (!requiredFields) return ['name', 'email'];
  if (Array.isArray(requiredFields)) return requiredFields;
  
  // Se for um objeto { name: boolean, email: boolean, ... }
  const result: string[] = [];
  if (requiredFields.name) result.push('name');
  if (requiredFields.email) result.push('email');
  if (requiredFields.phone) result.push('phone');
  if (requiredFields.cpf) result.push('cpf');
  return result.length > 0 ? result : ['name', 'email'];
}
  
  // Calcular total (com order bumps e cupom)
  const totalAmount = useMemo(() => {
    if (finalTotalWithDiscount !== null) {
      return finalTotalWithDiscount;
    }
    return formManager.calculateTotal();
  }, [finalTotalWithDiscount, formManager]);
  
  // Estilos do formulário de cartão
  const cardFormStyles = useMemo(() => ({
    textColor: design?.colors.creditCardFields?.textColor || design?.colors.primaryText,
    placeholderColor: design?.colors.creditCardFields?.placeholderColor || design?.colors.secondaryText,
    borderColor: design?.colors.creditCardFields?.borderColor || design?.colors.border,
    backgroundColor: design?.colors.creditCardFields?.backgroundColor || design?.colors.formBackground,
    focusBorderColor: design?.colors.creditCardFields?.focusBorderColor || design?.colors.active,
    focusTextColor: design?.colors.creditCardFields?.focusTextColor || design?.colors.primaryText,
  }), [design]);
  
  // PaymentOrchestrator - Gerencia SDK e pagamentos
  const paymentGateway = usePaymentOrchestrator({
    vendorId: null,
    checkoutId: checkout?.id || null,
    productId: checkout?.product?.id || null,
    productName: checkout?.product?.name || null,
    productPrice: checkout?.product?.price ? checkout.product.price * 100 : 0,
    publicKey: mercadoPagoPublicKey || null,
    amount: totalAmount,
    formData: formManager.formData,
    selectedBumps: formManager.selectedBumps,
    orderBumps: orderBumps || [],
  });
  
  // TrackingService (apenas UTMify)
  const trackingService = useTrackingService({
    vendorId: null,
    productId: checkout?.product?.id || null,
    productName: checkout?.product?.name || null,
    trackingConfig: {
      utmifyConfig,
    },
  });
  
  // ============================================================================
  // 5. HANDLERS
  // ============================================================================
  
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!checkout) return;
    
    // 1. Validação dos Dados Pessoais (Síncrona)
    const isPersonalDataValid = formManager.validateForm();
    
    // 2. Validação do Pagamento (Mercado Pago)
    let isCardValid = true;
    
    if (paymentGateway.selectedPayment === 'credit_card') {
      // Tenta validar visualmente o cartão
      const result = await paymentGateway.validateOnly();
      isCardValid = result.isValid;
      
      if (!result.isValid) {
        console.log("Erros do Cartão detectados:", result.errors);
      }
    }

    // 3. Bloqueio Final
    // Se qualquer um dos dois falhar, paramos TUDO aqui.
    if (!isPersonalDataValid || !isCardValid) {
      console.log("Bloqueio de compra: Campos inválidos detectados.");
      
      // Feedback visual extra para o usuário
      if (!isPersonalDataValid) {
        toast.error("Por favor, preencha seus dados pessoais.");
      } else if (!isCardValid) {
        toast.error("Verifique os dados do cartão.");
      }
      
      return;
    }
    
    // 4. Se chegou aqui, dados pessoais estão OK e cartão (se selecionado) parece OK.
    // Segue para o pagamento real
    trackingService.fireInitiateCheckout(formManager.selectedBumps, orderBumps);
    formManager.setProcessing(true);
    
    try {
      await paymentGateway.submitPayment();
    } catch (error) {
      console.error('[ControllerV2] Erro no submit:', error);
      formManager.setProcessing(false);
    }
  };
  
  // ============================================================================
  // 6. RETORNO (Contrato com a UI)
  // ============================================================================
  
  return {
    // Estado
    state: {
      isLoading,
      isError,
      checkout,
      design,
      viewMode: 'public' as const,
      orderBumps,
      selectedPayment: paymentGateway.selectedPayment,
      finalTotalWithDiscount,
      appliedCouponData,
      mercadoPagoPublicKey,
      mercadoPagoSDKLoaded: paymentGateway.isSDKLoaded,
      shouldShowPaymentForm: Boolean(isMpAvailable && mercadoPagoPublicKey),
      mpIntegration,
      isMpAvailable,
    },
    
    // Hooks de Serviço
    hooks: {
      form: formManager,
      payment: paymentGateway,
      tracking: trackingService,
    },
    
    // Configurações de Tracking (apenas UTMify para TrackingManager)
    tracking: {
      utmifyConfig,
    },
    
    // Ações
    actions: {
      setSelectedPayment: paymentGateway.setSelectedPayment,
      setFinalTotalWithDiscount,
      setAppliedCouponData,
      handleSubmit,
    },
    
    // Refs
    refs: {
      paymentSectionRef,
    },
  };
};
