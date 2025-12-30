/**
 * usePixPayment - Hook para processamento de pagamentos PIX
 * 
 * Responsabilidade ÚNICA: Processar pagamentos PIX por gateway
 * 
 * Gateways suportados:
 * - PushinPay: Navega direto (QR gerado na página)
 * - Mercado Pago: Chama edge function, navega com QR
 * - Stripe: Chama edge function, navega com QR
 * - Asaas: Chama edge function, navega com QR
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { PixGateway, PaymentConfig, PixNavigationState } from "./types";

interface UsePixPaymentProps {
  config: PaymentConfig;
  amount: number;
}

interface UsePixPaymentReturn {
  processPixPayment: (
    orderId: string,
    accessToken: string,
    gateway: PixGateway
  ) => Promise<void>;
}

export function usePixPayment({ config, amount }: UsePixPaymentProps): UsePixPaymentReturn {
  const navigate = useNavigate();

  const processPixPayment = useCallback(async (
    orderId: string,
    accessToken: string,
    gateway: PixGateway
  ) => {
    console.log(`[usePixPayment] Processando PIX via ${gateway}...`);

    const navigateToPixPage = (state: PixNavigationState) => {
      navigate(`/pay/pix/${orderId}`, { state });
    };

    switch (gateway) {
      case 'pushinpay': {
        // PushinPay: QR gerado na página de PIX
        navigateToPixPage({
          gateway: 'pushinpay',
          accessToken,
          amount
        });
        break;
      }

      case 'stripe': {
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

        navigateToPixPage({
          gateway: 'stripe',
          accessToken,
          amount,
          qrCode: paymentData.qr_code,
          qrCodeText: paymentData.qr_code_text
        });
        break;
      }

      case 'mercadopago': {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          "mercadopago-create-payment",
          {
            body: {
              orderId,
              payerEmail: config.formData.email,
              payerName: config.formData.name,
              payerDocument: config.formData.document?.replace(/\D/g, '') || null,
              paymentMethod: 'pix',
              token: null,
              installments: 1
            }
          }
        );

        if (paymentError || !paymentData?.success) {
          throw new Error(paymentData?.error || "Erro ao gerar QR Code PIX.");
        }

        navigateToPixPage({
          gateway: 'mercadopago',
          accessToken,
          amount,
          qrCode: paymentData.data?.pix?.qrCode || paymentData.data?.pix?.qr_code,
          qrCodeBase64: paymentData.data?.pix?.qrCodeBase64 || paymentData.data?.pix?.qr_code_base64
        });
        break;
      }

      case 'asaas': {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          "asaas-create-payment",
          {
            body: {
              orderId,
              // vendorId não é mais necessário - busca da order no backend
              amountCents: amount,
              customer: {
                name: config.formData.name,
                email: config.formData.email,
                document: (config.formData.cpf || config.formData.document)?.replace(/\D/g, '') || '',
                phone: config.formData.phone || undefined,
              },
              description: `Pedido ${orderId}`,
              paymentMethod: 'pix',
            }
          }
        );

        if (paymentError || !paymentData?.success) {
          throw new Error(paymentData?.error || "Erro ao gerar QR Code PIX via Asaas.");
        }

        navigateToPixPage({
          gateway: 'asaas',
          accessToken,
          amount,
          qrCode: paymentData.qrCode,
          qrCodeText: paymentData.qrCodeText
        });
        break;
      }

      default:
        throw new Error(`Gateway PIX não suportado: ${gateway}`);
    }
  }, [navigate, config, amount]);

  return { processPixPayment };
}
