/**
 * usePixRecovery - Hook de recuperação resiliente para PIX
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Este hook garante que o pagamento PIX funcione mesmo quando:
 * 1. O usuário acessa a URL diretamente (sem navigation state)
 * 2. O usuário dá refresh na página
 * 3. O navigation state é perdido
 * 
 * Estratégia de recuperação:
 * 1. Tentar usar dados do navState (qrCode já gerado)
 * 2. Se não houver navState, chamar get-pix-status (RPC pública)
 * 3. Se PIX existe no banco, usar diretamente
 * 4. Se não existe, mostrar erro (sem accessToken não pode criar novo)
 * 
 * @module pix-payment/hooks
 */

import { useState, useCallback, useEffect } from "react";
import { publicApi } from "@/lib/api/public-client";
import { createLogger } from "@/lib/logger";
import type { 
  PixNavigationData, 
  PixStatusResponse 
} from "@/types/checkout-payment.types";

const log = createLogger("usePixRecovery");

// ============================================================================
// TYPES
// ============================================================================

export type RecoveryStatus = 
  | 'idle'
  | 'checking'
  | 'recovered_from_state'
  | 'recovered_from_db'
  | 'needs_regeneration'
  | 'error';

export interface RecoveredPixData {
  qrCode: string;
  qrCodeBase64?: string | null;
  qrCodeText?: string | null;
  amount: number;
  checkoutSlug?: string | null;
  source: 'navState' | 'database';
}

export interface UsePixRecoveryReturn {
  recoveryStatus: RecoveryStatus;
  recoveredData: RecoveredPixData | null;
  accessToken: string | null;
  checkoutSlug: string | null;
  errorMessage: string | null;
  attemptRecovery: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePixRecovery(
  orderId: string | undefined,
  navState: PixNavigationData | null
): UsePixRecoveryReturn {
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>('idle');
  const [recoveredData, setRecoveredData] = useState<RecoveredPixData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [checkoutSlug, setCheckoutSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const attemptRecovery = useCallback(async () => {
    if (!orderId) {
      log.warn("Tentativa de recuperação sem orderId");
      setRecoveryStatus('error');
      setErrorMessage("ID do pedido não fornecido");
      return;
    }

    setRecoveryStatus('checking');
    log.info("Iniciando recuperação PIX", { orderId, hasNavState: !!navState });

    // Estratégia 1: Tentar via navState (mais rápido, já tem QR)
    if (navState) {
      // Armazenar accessToken e checkoutSlug do navState
      if (navState.accessToken) {
        setAccessToken(navState.accessToken);
      }
      if (navState.checkoutSlug) {
        setCheckoutSlug(navState.checkoutSlug);
      }

      // Se tem QR code no navState, usar diretamente
      if (navState.qrCode || navState.qrCodeText || navState.qrCodeBase64) {
        log.info("Recuperado via navState", { gateway: navState.gateway });
        
        setRecoveredData({
          qrCode: navState.qrCode || navState.qrCodeText || '',
          qrCodeBase64: navState.qrCodeBase64,
          qrCodeText: navState.qrCodeText,
          amount: navState.amount,
          checkoutSlug: navState.checkoutSlug,
          source: 'navState',
        });
        setRecoveryStatus('recovered_from_state');
        return;
      }
    }

    // Estratégia 2: Buscar do banco via get-pix-status
    try {
      log.info("Buscando PIX do banco", { orderId });

      const { data, error } = await publicApi.call<PixStatusResponse>(
        "get-pix-status",
        { orderId }
      );

      if (error || !data?.success) {
        log.error("Falha ao buscar status PIX", { error: error?.message ?? data?.error });
        setRecoveryStatus('error');
        setErrorMessage(data?.error ?? "Não foi possível recuperar os dados do pagamento");
        return;
      }

      // Armazenar checkoutSlug do banco
      if (data.checkout_slug) {
        setCheckoutSlug(data.checkout_slug);
      }

      // Se PIX existe no banco, usar
      if (data.pix_qr_code) {
        log.info("Recuperado via banco", { 
          pixStatus: data.pix_status,
          orderStatus: data.order_status,
        });

        setRecoveredData({
          qrCode: data.pix_qr_code,
          amount: data.amount_cents ?? 0,
          checkoutSlug: data.checkout_slug,
          source: 'database',
        });
        setRecoveryStatus('recovered_from_db');
        return;
      }

      // PIX não existe e não temos accessToken para criar
      // Verificar se já tem accessToken do navState
      if (!navState?.accessToken) {
        log.warn("PIX não existe e sem accessToken para criar novo");
        setRecoveryStatus('error');
        setErrorMessage("Pagamento não encontrado. Retorne ao checkout para tentar novamente.");
        return;
      }

      // Tem accessToken mas não tem PIX - pode tentar regenerar
      log.info("PIX não existe mas tem accessToken - pode regenerar");
      setRecoveryStatus('needs_regeneration');

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log.error("Erro na recuperação", { error: errMsg });
      setRecoveryStatus('error');
      setErrorMessage("Erro ao recuperar dados do pagamento");
    }
  }, [orderId, navState]);

  // Auto-recover on mount
  useEffect(() => {
    if (recoveryStatus === 'idle' && orderId) {
      attemptRecovery();
    }
  }, [orderId, recoveryStatus, attemptRecovery]);

  return {
    recoveryStatus,
    recoveredData,
    accessToken,
    checkoutSlug,
    errorMessage,
    attemptRecovery,
  };
}
