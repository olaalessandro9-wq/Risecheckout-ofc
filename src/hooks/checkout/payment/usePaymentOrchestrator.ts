/**
 * usePaymentOrchestrator - Hook orquestrador de pagamentos
 * 
 * Este é o hook PRINCIPAL que substitui o antigo usePaymentGateway.
 * 
 * Responsabilidades:
 * - Orquestrar os hooks especializados (order, pix, card)
 * - Gerenciar estado de processamento
 * - Carregar SDK quando necessário
 * - Validar dados antes de processar
 * 
 * Arquitetura: Facade Pattern sobre hooks especializados
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createCardToken } from '@mercadopago/sdk-react';
import type { PaymentMethod } from "@/types/checkout";
import { useOrderCreation } from "./useOrderCreation";
import { usePixPayment } from "./usePixPayment";
import { useCardPayment } from "./useCardPayment";
import type { 
  PaymentConfig, 
  PixGateway, 
  CreditCardGateway, 
  AppliedCoupon,
  CardPaymentData 
} from "./types";

// ============================================================================
// PROPS E RETURN TYPES
// ============================================================================

interface UsePaymentOrchestratorProps {
  vendorId: string | null;
  checkoutId: string | null;
  productId: string | null;
  offerId?: string | null;
  productName: string | null;
  productPrice: number;
  publicKey: string | null;
  amount: number;
  formData: any;
  selectedBumps: Set<string>;
  orderBumps: any[];
  appliedCoupon?: AppliedCoupon | null;
  pixGateway?: PixGateway;
  creditCardGateway?: CreditCardGateway;
}

interface ValidationResult {
  isValid: boolean;
  errors: any[];
}

interface UsePaymentOrchestratorReturn {
  selectedPayment: PaymentMethod;
  setSelectedPayment: (method: PaymentMethod) => void;
  isSDKLoaded: boolean;
  showPixPayment: boolean;
  orderId: string | null;
  submitPayment: (
    token?: string, 
    installments?: number, 
    paymentMethodId?: string, 
    issuerId?: string, 
    holderDocument?: string
  ) => Promise<void>;
  validateOnly: () => Promise<ValidationResult>;
  isProcessing: boolean;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function usePaymentOrchestrator({
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
}: UsePaymentOrchestratorProps): UsePaymentOrchestratorReturn {

  // ============================================================================
  // ESTADO LOCAL
  // ============================================================================
  
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("pix");
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs para valores atuais (evitar stale closures)
  const amountRef = useRef(amount);
  const selectedBumpsRef = useRef(selectedBumps);
  const orderBumpsRef = useRef(orderBumps);
  const appliedCouponRef = useRef(appliedCoupon);

  // Manter refs atualizadas
  useEffect(() => { amountRef.current = amount; }, [amount]);
  useEffect(() => { selectedBumpsRef.current = selectedBumps; }, [selectedBumps]);
  useEffect(() => { orderBumpsRef.current = orderBumps; }, [orderBumps]);
  useEffect(() => { appliedCouponRef.current = appliedCoupon; }, [appliedCoupon]);

  // ============================================================================
  // CONFIG PARA HOOKS FILHOS
  // ============================================================================

  const config: PaymentConfig = {
    vendorId,
    checkoutId,
    productId,
    offerId,
    productName,
    productPrice,
    publicKey,
    formData,
    pixGateway,
    creditCardGateway,
  };

  // ============================================================================
  // HOOKS ESPECIALIZADOS
  // ============================================================================

  const { createOrder } = useOrderCreation({ config });
  const { processPixPayment } = usePixPayment({ config, amount: amountRef.current });
  const { processCardPayment } = useCardPayment({ config, amount: amountRef.current });

  // ============================================================================
  // CARREGAR SDK
  // ============================================================================

  useEffect(() => {
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
        console.log("[PaymentOrchestrator] ✅ SDK carregada");
        setIsSDKLoaded(true);
      }
    };
    script.onerror = () => {
      console.error("[PaymentOrchestrator] ❌ Erro ao carregar SDK");
      toast.error("Erro ao carregar o sistema de pagamento");
    };
    document.head.appendChild(script);
  }, [publicKey, creditCardGateway, pixGateway]);

  // ============================================================================
  // VALIDAÇÃO (para triggerar validação visual do MP)
  // ============================================================================

  const validateOnly = useCallback(async (): Promise<ValidationResult> => {
    if (selectedPayment === 'credit_card') {
      try {
        await createCardToken({
          cardholderName: '',
          identificationType: 'CPF',
          identificationNumber: '',
        });
        return { isValid: true, errors: [] };
      } catch (e: any) {
        return { isValid: false, errors: e.cause || [] };
      }
    }
    return { isValid: true, errors: [] };
  }, [selectedPayment]);

  // ============================================================================
  // SUBMIT PRINCIPAL
  // ============================================================================

  const submitPayment = useCallback(async (
    token?: string,
    installments?: number,
    paymentMethodId?: string,
    issuerId?: string,
    holderDocument?: string
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Determinar método e gateway
      const actualPaymentMethod: PaymentMethod = token ? "credit_card" : selectedPayment;
      const activeGateway = actualPaymentMethod === 'pix' ? pixGateway : creditCardGateway;

      console.log("[PaymentOrchestrator] Iniciando...", {
        method: actualPaymentMethod,
        gateway: activeGateway,
        hasToken: !!token
      });

      // Validações básicas
      if (!formData.email || !formData.name) {
        toast.error("Por favor, preencha seus dados pessoais.");
        return;
      }

      if (actualPaymentMethod === "credit_card" && !token) {
        await validateOnly();
        toast.error("Erro ao processar cartão. Verifique os dados.");
        return;
      }

      // 1. CRIAR PEDIDO
      const orderResult = await createOrder(
        actualPaymentMethod,
        activeGateway,
        selectedBumpsRef.current,
        orderBumpsRef.current,
        appliedCouponRef.current || null
      );

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Erro ao criar pedido.");
      }

      setOrderId(orderResult.order_id);

      // 2. PROCESSAR PAGAMENTO
      if (actualPaymentMethod === "pix") {
        setShowPixPayment(true);
        await processPixPayment(
          orderResult.order_id,
          orderResult.access_token,
          activeGateway as PixGateway
        );
      } else {
        const cardData: CardPaymentData = {
          token: token!,
          installments: installments || 1,
          paymentMethodId,
          issuerId,
          holderDocument, // CPF do cartão passa DIRETO aqui
        };
        
        await processCardPayment(
          orderResult.order_id,
          orderResult.access_token,
          activeGateway as CreditCardGateway,
          cardData
        );
      }
    } catch (error: any) {
      console.error("[PaymentOrchestrator] Erro:", error);
      toast.error(error.message || "Não foi possível processar seu pagamento.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    selectedPayment,
    formData,
    pixGateway,
    creditCardGateway,
    createOrder,
    processPixPayment,
    processCardPayment,
    validateOnly
  ]);

  return {
    selectedPayment,
    setSelectedPayment,
    isSDKLoaded,
    showPixPayment,
    orderId,
    submitPayment,
    validateOnly,
    isProcessing,
  };
}
