/**
 * usePaymentAccountCheck
 * 
 * @version 2.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";

const log = createLogger("PaymentAccountCheck");

interface PaymentAccountStatus {
  hasPaymentAccount: boolean | null;
  hasMercadoPago: boolean;
  hasStripe: boolean;
  isLoading: boolean;
}

interface GatewayStatusResponse {
  hasPaymentAccount?: boolean;
  hasMercadoPago?: boolean;
  hasStripe?: boolean;
}

/**
 * Hook para verificar se o usuário logado possui conta de pagamento conectada
 * (Mercado Pago ou Stripe) para receber comissões de afiliação.
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 */
export function usePaymentAccountCheck(): PaymentAccountStatus {
  const { user } = useUnifiedAuth();
  const [status, setStatus] = useState<PaymentAccountStatus>({
    hasPaymentAccount: null,
    hasMercadoPago: false,
    hasStripe: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkPaymentAccount = async () => {
      if (!user?.id) {
        setStatus({
          hasPaymentAccount: false,
          hasMercadoPago: false,
          hasStripe: false,
          isLoading: false,
        });
        return;
      }

      try {
        const { data, error } = await api.call<GatewayStatusResponse>("admin-data", {
          action: "user-gateway-status",
        });

        if (error) throw error;

        setStatus({
          hasPaymentAccount: data?.hasPaymentAccount || false,
          hasMercadoPago: data?.hasMercadoPago || false,
          hasStripe: data?.hasStripe || false,
          isLoading: false,
        });
      } catch (err) {
        log.error("Erro ao verificar conta de pagamento:", err);
        setStatus({
          hasPaymentAccount: false,
          hasMercadoPago: false,
          hasStripe: false,
          isLoading: false,
        });
      }
    };

    checkPaymentAccount();
  }, [user?.id]);

  return status;
}
