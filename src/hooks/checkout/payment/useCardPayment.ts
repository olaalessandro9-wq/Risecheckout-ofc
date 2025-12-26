/**
 * useCardPayment - Hook para processamento de pagamentos com cartão
 * 
 * Responsabilidade ÚNICA: Processar pagamentos com cartão por gateway
 * 
 * Gateways suportados:
 * - Mercado Pago
 * - Stripe
 * - Asaas
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CreditCardGateway, CardPaymentData, PaymentConfig } from "./types";

interface UseCardPaymentProps {
  config: PaymentConfig;
  amount: number;
}

interface UseCardPaymentReturn {
  processCardPayment: (
    orderId: string,
    accessToken: string,
    gateway: CreditCardGateway,
    cardData: CardPaymentData
  ) => Promise<void>;
}

export function useCardPayment({ config, amount }: UseCardPaymentProps): UseCardPaymentReturn {
  const navigate = useNavigate();

  const navigateToSuccess = (orderId: string, accessToken?: string) => {
    const url = `/success/${orderId}${accessToken ? `?token=${accessToken}` : ''}`;
    navigate(url);
  };

  const processCardPayment = useCallback(async (
    orderId: string,
    accessToken: string,
    gateway: CreditCardGateway,
    cardData: CardPaymentData
  ) => {
    console.log(`[useCardPayment] Processando cartão via ${gateway}...`, {
      hasToken: !!cardData.token,
      installments: cardData.installments,
      hasHolderDocument: !!cardData.holderDocument
    });

    switch (gateway) {
      case 'stripe': {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderId,
              payment_method: 'credit_card',
              payment_method_id: cardData.token, // No Stripe, token é o payment_method_id
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
          navigateToSuccess(orderId, accessToken);
        } else if (paymentData.status === 'requires_action') {
          // 3D Secure - redirecionar para autenticação
          window.location.href = paymentData.next_action_url;
        } else {
          toast.error("Pagamento não aprovado. Verifique os dados do cartão.");
        }
        break;
      }

      case 'mercadopago': {
        // CRÍTICO: holderDocument (CPF do cartão) vem DIRETAMENTE do MercadoPagoCardForm
        const payerDocumentFinal = cardData.holderDocument?.replace(/\D/g, '') || null;
        
        console.log('[useCardPayment] CPF do cartão para MP:', {
          holderDocument: cardData.holderDocument || '(vazio)',
          payerDocumentFinal: payerDocumentFinal || '(NULL)'
        });

        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          "mercadopago-create-payment",
          {
            body: {
              orderId,
              payerEmail: config.formData.email,
              payerName: config.formData.name,
              payerDocument: payerDocumentFinal,
              paymentMethod: 'credit_card',
              token: cardData.token,
              installments: cardData.installments,
              paymentMethodId: cardData.paymentMethodId,
              issuerId: cardData.issuerId
            }
          }
        );

        if (paymentError || !paymentData?.success) {
          throw new Error(paymentData?.error || "Erro ao processar pagamento.");
        }

        if (paymentData.data?.status === 'approved') {
          toast.success("Pagamento aprovado com sucesso!");
          navigateToSuccess(orderId, accessToken);
        } else {
          toast.error("Pagamento não aprovado. Verifique os dados do cartão.");
        }
        break;
      }

      case 'asaas': {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          "asaas-create-payment",
          {
            body: {
              orderId,
              vendorId: config.vendorId,
              amountCents: amount,
              customer: {
                name: config.formData.name,
                email: config.formData.email,
                document: (config.formData.cpf || config.formData.document)?.replace(/\D/g, '') || '',
                phone: config.formData.phone || undefined,
              },
              description: `Pedido ${orderId}`,
              paymentMethod: 'credit_card',
              cardToken: cardData.token,
              installments: cardData.installments,
            }
          }
        );

        if (paymentError || !paymentData?.success) {
          throw new Error(paymentData?.error || "Erro ao processar pagamento via Asaas.");
        }

        if (paymentData.status === 'approved' || paymentData.status === 'processing') {
          toast.success("Pagamento aprovado com sucesso!");
          navigateToSuccess(orderId, accessToken);
        } else {
          toast.error("Pagamento não aprovado. Verifique os dados do cartão.");
        }
        break;
      }

      default:
        throw new Error(`Gateway de cartão não suportado: ${gateway}`);
    }
  }, [navigate, config, amount]);

  return { processCardPayment };
}
