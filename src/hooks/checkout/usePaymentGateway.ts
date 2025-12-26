/**
 * Hook: usePaymentGateway
 * 
 * Responsabilidade: Orquestrar o fluxo de pagamento multi-gateway:
 * 
 * PIX:
 * - PushinPay: create-order → navega /pix (PushinPay gera QR lá)
 * - Mercado Pago: create-order → mercadopago-create-payment → navega /pix com QR
 * 
 * Cartão:
 * - Mercado Pago: create-order → mercadopago-create-payment → navega /success
 * - (Futuro: Stripe, PagarMe, etc)
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createCardToken } from '@mercadopago/sdk-react';
import type { PaymentMethod, CheckoutFormData } from "@/types/checkout";
import { getAffiliateCode } from "@/hooks/useAffiliateTracking";

// ============================================================================
// TYPES - Preparado para múltiplos gateways
// ============================================================================

type PixGateway = 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
type CreditCardGateway = 'mercadopago' | 'stripe' | 'asaas';

// Interface para cupom aplicado
interface AppliedCoupon {
  id: string;
  code: string;
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  apply_to_order_bumps: boolean;
}

interface UsePaymentGatewayProps {
  vendorId: string | null;
  checkoutId: string | null;
  productId: string | null;
  offerId?: string | null;
  productName: string | null;
  productPrice: number; // em centavos
  publicKey: string | null;
  amount: number; // em centavos (total com bumps)
  formData: CheckoutFormData;
  selectedBumps: Set<string>;
  orderBumps: any[];
  cardFieldsStyle?: any;
  // NOVO: Cupom aplicado
  appliedCoupon?: AppliedCoupon | null;
  // NOVO: Gateways configurados pelo vendedor
  pixGateway?: PixGateway;
  creditCardGateway?: CreditCardGateway;
}

// Ref para capturar selectedBumps no momento do submit

interface ValidationResult {
  isValid: boolean;
  errors: any[];
}

interface UsePaymentGatewayReturn {
  selectedPayment: PaymentMethod;
  setSelectedPayment: (method: PaymentMethod) => void;
  isSDKLoaded: boolean;
  showPixPayment: boolean;
  orderId: string | null;
  submitPayment: (token?: string, installments?: number, paymentMethodId?: string, issuerId?: string, holderDocument?: string) => Promise<void>;
  validateOnly: () => Promise<ValidationResult>;
  isProcessing: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePaymentGateway({
  vendorId,
  checkoutId,
  productId,
  offerId,
  productName,
  productPrice,
  publicKey,
  amount,
  formData,
  selectedBumps,
  orderBumps,
  appliedCoupon,
  pixGateway = 'pushinpay',
  creditCardGateway = 'mercadopago',
}: UsePaymentGatewayProps): UsePaymentGatewayReturn {
  const navigate = useNavigate();

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("pix");
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const amountRef = useRef(amount);
  const selectedBumpsRef = useRef(selectedBumps);
  const orderBumpsRef = useRef(orderBumps);
  const appliedCouponRef = useRef(appliedCoupon);

  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  // CRÍTICO: Manter refs atualizados com os bumps selecionados
  useEffect(() => {
    selectedBumpsRef.current = selectedBumps;
    console.log("[usePaymentGateway] selectedBumps atualizado:", Array.from(selectedBumps));
  }, [selectedBumps]);

  useEffect(() => {
    orderBumpsRef.current = orderBumps;
  }, [orderBumps]);

  // NOVO: Manter ref do cupom atualizada
  useEffect(() => {
    appliedCouponRef.current = appliedCoupon;
    console.log("[usePaymentGateway] appliedCoupon atualizado:", appliedCoupon);
  }, [appliedCoupon]);

  // SDK Loading (apenas se usar Mercado Pago)
  useEffect(() => {
    // Só carregar SDK se precisar (cartão ou PIX via Mercado Pago)
    const needsMercadoPagoSDK = creditCardGateway === 'mercadopago' || pixGateway === 'mercadopago';
    if (!needsMercadoPagoSDK || !publicKey) return;

    if ((window as any).MercadoPago) {
      setIsSDKLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => {
      if ((window as any).MercadoPago) {
        console.log("[usePaymentGateway] ✅ SDK carregada com sucesso");
        setIsSDKLoaded(true);
      }
    };
    script.onerror = () => {
      console.error("[usePaymentGateway] ❌ Erro ao carregar SDK");
      toast.error("Erro ao carregar o sistema de pagamento");
    };
    document.head.appendChild(script);
  }, [publicKey, creditCardGateway, pixGateway]);

  // ============================================================================
  // VALIDATE ONLY - Força validação visual do SDK
  // ============================================================================
  const validateOnly = async (): Promise<ValidationResult> => {
    if (selectedPayment === 'credit_card') {
      try {
        console.log("[Gateway] Forçando validação visual dos iframes...");
        await createCardToken({
          cardholderName: '',
          identificationType: 'CPF',
          identificationNumber: '',
        });
        return { isValid: true, errors: [] };
      } catch (e: any) {
        console.warn("[Gateway] Erro de validação capturado (esperado):", e);
        const mpErrors = e.cause || [];
        return { isValid: false, errors: mpErrors };
      }
    }
    return { isValid: true, errors: [] };
  };

  // ============================================================================
  // SUBMIT PAYMENT - Fluxo multi-gateway
  // ============================================================================

  const submitPayment = async (
    token?: string,
    installments?: number,
    paymentMethodId?: string,
    issuerId?: string,
    holderDocument?: string // CPF do titular do cartão (vem do MercadoPagoCardForm)
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Determinar método baseado na presença do token
    const actualPaymentMethod: PaymentMethod = token ? "credit_card" : selectedPayment;
    
    // Determinar gateway baseado no método
    const activeGateway = actualPaymentMethod === 'pix' ? pixGateway : creditCardGateway;

    console.log("[usePaymentGateway] Iniciando processamento...", {
      method: actualPaymentMethod,
      gateway: activeGateway,
      amount: amountRef.current,
      hasToken: !!token
    });

    try {
      // 1. Validações básicas
      if (!formData.email || !formData.name) {
        toast.error("Por favor, preencha seus dados pessoais.");
        setIsProcessing(false);
        return;
      }

      if (actualPaymentMethod === "credit_card" && !token) {
        await validateOnly();
        toast.error("Erro ao processar cartão. Verifique os dados.");
        setIsProcessing(false);
        return;
      }

      // 2. ETAPA 1: Criar pedido via create-order
      console.log("[usePaymentGateway] Etapa 1: Criando pedido...");
      
      // CRÍTICO: Usar refs para pegar valores ATUAIS no momento do submit
      const currentSelectedBumps = selectedBumpsRef.current;
      const currentOrderBumps = orderBumpsRef.current;
      
      console.log("[usePaymentGateway] DEBUG Bumps:", {
        selectedBumpsSize: currentSelectedBumps.size,
        selectedBumpsArray: Array.from(currentSelectedBumps),
        orderBumpsCount: currentOrderBumps.length
      });
      
      const orderBumpIds = currentOrderBumps
        .filter(b => currentSelectedBumps.has(b.id))
        .map(b => b.id);
      
      console.log("[usePaymentGateway] orderBumpIds a enviar:", orderBumpIds);

      // CRÍTICO: Pegar cupom atual no momento do submit
      const currentCoupon = appliedCouponRef.current;
      
      const createOrderPayload = {
        product_id: productId,
        offer_id: offerId || productId,
        checkout_id: checkoutId,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone || null,
        customer_cpf: (formData.cpf || formData.document)?.replace(/\D/g, '') || null,
        order_bump_ids: orderBumpIds,
        gateway: activeGateway.toUpperCase(), // PUSHINPAY ou MERCADOPAGO
        payment_method: actualPaymentMethod,
        // NOVO: Enviar cupom para o backend processar
        coupon_id: currentCoupon?.id || null,
        // NOVO: Enviar código de afiliado para processar split
        affiliate_code: getAffiliateCode()
      };
      
      console.log("[usePaymentGateway] Cupom aplicado:", currentCoupon);

      console.log("[usePaymentGateway] Payload create-order:", createOrderPayload);

      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-order", {
        body: createOrderPayload
      });

      if (orderError) {
        console.error("[usePaymentGateway] Erro ao criar pedido:", orderError);
        throw new Error("Erro ao criar pedido. Tente novamente.");
      }

      if (!orderData?.success || !orderData?.order_id) {
        console.error("[usePaymentGateway] Resposta inválida do create-order:", orderData);
        throw new Error(orderData?.error || "Erro ao criar pedido.");
      }

      const createdOrderId = orderData.order_id;
      const accessToken = orderData.access_token;
      console.log("[usePaymentGateway] ✅ Pedido criado:", createdOrderId);
      setOrderId(createdOrderId);

      // ========================================================================
      // 3. ETAPA 2: Roteamento por Gateway
      // ========================================================================

      if (actualPaymentMethod === "pix") {
        await handlePixPayment(createdOrderId, accessToken, activeGateway as PixGateway);
      } else {
        await handleCardPayment(createdOrderId, accessToken, token!, installments || 1, paymentMethodId, issuerId, holderDocument);
      }

    } catch (error: any) {
      console.error("[usePaymentGateway] Erro no pagamento:", error);
      toast.error(error.message || "Não foi possível processar seu pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // PIX HANDLERS - Por Gateway
  // ============================================================================

  const handlePixPayment = async (
    orderId: string, 
    accessToken: string, 
    gateway: PixGateway
  ) => {
    console.log(`[usePaymentGateway] Processando PIX via ${gateway}...`);

    if (gateway === 'pushinpay') {
      // PushinPay: Navega para /pay/pix e lá o QR é gerado
      setShowPixPayment(true);
      navigate(`/pay/pix/${orderId}`, {
        state: {
          gateway: 'pushinpay',
          accessToken,
          amount: amountRef.current
        }
      });
    } else if (gateway === 'stripe') {
      // Stripe: Chamar Edge Function para gerar QR Code PIX
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            payment_method: 'pix',
          }),
        }
      );

      const paymentData = await response.json();

      if (!response.ok || !paymentData.success) {
        throw new Error(paymentData.error || "Erro ao gerar QR Code PIX via Stripe.");
      }

      setShowPixPayment(true);
      navigate(`/pay/pix/${orderId}`, {
        state: {
          gateway: 'stripe',
          qrCode: paymentData.qr_code,
          qrCodeText: paymentData.qr_code_text,
          amount: amountRef.current,
          accessToken
        }
      });
    } else if (gateway === 'mercadopago') {
      // Mercado Pago: Precisa chamar a Edge Function para gerar o QR
      const paymentPayload = {
        orderId,
        payerEmail: formData.email,
        payerName: formData.name,
        payerDocument: formData.document?.replace(/\D/g, '') || null,
        paymentMethod: 'pix',
        token: null,
        installments: 1
      };

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("mercadopago-create-payment", {
        body: paymentPayload
      });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || "Erro ao gerar QR Code PIX.");
      }

      setShowPixPayment(true);
      navigate(`/pay/pix/${orderId}`, {
        state: {
          gateway: 'mercadopago',
          qrCode: paymentData.data?.pix?.qr_code || paymentData.data?.pix?.qrCode,
          qrCodeBase64: paymentData.data?.pix?.qr_code_base64 || paymentData.data?.pix?.qrCodeBase64,
          amount: amountRef.current,
          accessToken
        }
      });
    } else if (gateway === 'asaas') {
      // Asaas: Chamar Edge Function para gerar QR Code PIX
      const paymentPayload = {
        orderId,
        vendorId,
        amountCents: amountRef.current,
        customer: {
          name: formData.name,
          email: formData.email,
          document: (formData.cpf || formData.document)?.replace(/\D/g, '') || '',
          phone: formData.phone || undefined,
        },
        description: `Pedido ${orderId}`,
        paymentMethod: 'pix',
      };

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("asaas-create-payment", {
        body: paymentPayload
      });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || "Erro ao gerar QR Code PIX via Asaas.");
      }

      setShowPixPayment(true);
      navigate(`/pay/pix/${orderId}`, {
        state: {
          gateway: 'asaas',
          qrCode: paymentData.qrCode,
          qrCodeText: paymentData.qrCodeText,
          amount: amountRef.current,
          accessToken
        }
      });
    }
  };

  // ============================================================================
  // CARD HANDLERS - Por Gateway
  // ============================================================================

  const handleCardPayment = async (
    orderId: string,
    accessToken: string,
    token: string,
    installments: number,
    paymentMethodId?: string,
    issuerId?: string,
    holderDocument?: string // CPF do titular vindo do formulário de cartão
  ) => {
    console.log(`[usePaymentGateway] Processando cartão via ${creditCardGateway}...`);

    if (creditCardGateway === 'stripe') {
      // Stripe: Criar Payment Intent e confirmar
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            payment_method: 'credit_card',
            payment_method_id: token, // No Stripe, token é o payment_method_id
            return_url: `${window.location.origin}/success/${orderId}${accessToken ? `?token=${accessToken}` : ''}`,
          }),
        }
      );

      const paymentData = await response.json();

      if (!response.ok || !paymentData.success) {
        throw new Error(paymentData.error || "Erro ao processar pagamento via Stripe.");
      }

      if (paymentData.status === 'succeeded' || paymentData.status === 'processing') {
        toast.success("Pagamento aprovado com sucesso!");
        navigate(`/success/${orderId}${accessToken ? `?token=${accessToken}` : ''}`);
      } else if (paymentData.status === 'requires_action') {
        // 3D Secure necessário - redirecionar para autenticação
        window.location.href = paymentData.next_action_url;
      } else {
        toast.error("Pagamento não aprovado. Verifique os dados do cartão.");
      }
    } else if (creditCardGateway === 'mercadopago') {
      // CORREÇÃO: Usar CPF do cartão (obrigatório), fallback para CPF pessoal (opcional)
      const payerDocumentFinal = holderDocument || formData.document?.replace(/\D/g, '') || null;
      
      console.log('[usePaymentGateway] CPF enviado para MP:', {
        holderDocument: holderDocument || '(vazio)',
        formDataDocument: formData.document || '(vazio)',
        payerDocumentFinal: payerDocumentFinal || '(NULL - PROBLEMA!)'
      });
      
      const paymentPayload = {
        orderId,
        payerEmail: formData.email,
        payerName: formData.name,
        payerDocument: payerDocumentFinal,
        paymentMethod: 'credit_card',
        token,
        installments,
        paymentMethodId,
        issuerId
      };

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("mercadopago-create-payment", {
        body: paymentPayload
      });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || "Erro ao processar pagamento.");
      }

      if (paymentData.data?.status === 'approved') {
        toast.success("Pagamento aprovado com sucesso!");
        navigate(`/success/${orderId}${accessToken ? `?token=${accessToken}` : ''}`);
      } else {
        toast.error("Pagamento não aprovado. Verifique os dados do cartão.");
      }
    } else if (creditCardGateway === 'asaas') {
      // Asaas: Processar pagamento com cartão de crédito
      const paymentPayload = {
        orderId,
        vendorId,
        amountCents: amountRef.current,
        customer: {
          name: formData.name,
          email: formData.email,
          document: (formData.cpf || formData.document)?.replace(/\D/g, '') || '',
          phone: formData.phone || undefined,
        },
        description: `Pedido ${orderId}`,
        paymentMethod: 'credit_card',
        cardToken: token,
        installments: installments,
      };

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("asaas-create-payment", {
        body: paymentPayload
      });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || "Erro ao processar pagamento via Asaas.");
      }

      if (paymentData.status === 'approved' || paymentData.status === 'processing') {
        toast.success("Pagamento aprovado com sucesso!");
        navigate(`/success/${orderId}${accessToken ? `?token=${accessToken}` : ''}`);
      } else {
        toast.error("Pagamento não aprovado. Verifique os dados do cartão.");
      }
    }
  };

  return {
    selectedPayment,
    setSelectedPayment,
    isSDKLoaded,
    showPixPayment,
    orderId,
    submitPayment,
    validateOnly,
    isProcessing
  };
}
