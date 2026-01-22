/**
 * usePixCharge - Hook para criar cobrança PIX via PushinPay
 * 
 * Responsabilidade ÚNICA: Criar cobrança PIX e gerenciar QR code
 */

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";
import type { OrderDataFromRpc, PixNavigationState } from "../types";

const log = createLogger("PixCharge");

interface PixChargeResponse {
  ok?: boolean;
  pix?: {
    id?: string;
    pix_id?: string;
    qr_code?: string;
    qrcode?: string;
    emv?: string;
  };
  error?: string;
}

interface UsePixChargeReturn {
  qrCode: string;
  qrCodeImageBase64: string | null;
  pixId: string;
  loading: boolean;
  createCharge: () => Promise<void>;
  setQrCode: (qrCode: string) => void;
  setQrCodeImageBase64: (base64: string | null) => void;
  expiresAt: React.MutableRefObject<number>;
}

export function usePixCharge(
  orderId: string | undefined,
  orderData: OrderDataFromRpc | null,
  navState: PixNavigationState | null
): UsePixChargeReturn {
  const [qrCode, setQrCode] = useState("");
  const [qrCodeImageBase64, setQrCodeImageBase64] = useState<string | null>(null);
  const [pixId, setPixId] = useState("");
  const [loading, setLoading] = useState(true);
  
  const expiresAt = useRef<number>(0);

  const createCharge = useCallback(async () => {
    // Se já tem QR code (veio do Mercado Pago/Asaas/Stripe), não criar novamente
    if (qrCode) {
      log.debug("QR code já existe, não criando novo");
      return;
    }
    
    if (!orderId || !orderData) {
      log.debug("Aguardando dados", { orderId, hasOrderData: !!orderData });
      return;
    }

    // Validação explícita de amount_cents para evitar race condition
    const valueInCents = orderData.amount_cents;
    if (!valueInCents || valueInCents <= 0) {
      log.warn("amount_cents inválido, aguardando dados corretos", { 
        orderId, 
        amount_cents: valueInCents,
        orderDataKeys: Object.keys(orderData || {})
      });
      return;
    }

    setLoading(true);

    try {
      log.debug("Criando cobrança PIX via PushinPay", { 
        orderId, 
        valueInCents,
      });

      const { data, error } = await api.publicCall<PixChargeResponse>("pushinpay-create-pix", {
        orderId,
        valueInCents,
      });

      log.debug("Resposta da Edge Function", { data, error });

      if (error) {
        log.error("Erro da Edge Function", error);
        throw new Error(error.message || "Erro ao criar cobrança PIX");
      }

      if (!data?.ok) {
        log.error("Resposta não OK", data);
        throw new Error(data?.error || "Erro ao criar cobrança PIX");
      }

      if (!data?.pix) {
        log.error("Sem dados do PIX", data);
        throw new Error("Dados do PIX não retornados");
      }

      const { pix } = data;
      log.info("PIX criado com sucesso", { pixId: pix.id || pix.pix_id });
      
      setPixId(pix.id || pix.pix_id || "");
      setQrCode(pix.qr_code || pix.qrcode || pix.emv || "");
      
      // Definir expiração em 15 minutos
      expiresAt.current = Date.now() + 15 * 60 * 1000;
      
      setLoading(false);
      toast.success("QR Code gerado com sucesso!");
    } catch (err: unknown) {
      log.error("Erro ao criar PIX", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar QR Code");
      setLoading(false);
    }
  }, [orderId, orderData?.amount_cents, qrCode]);

  return { 
    qrCode, 
    qrCodeImageBase64, 
    pixId, 
    loading, 
    createCharge,
    setQrCode,
    setQrCodeImageBase64,
    expiresAt
  };
}
