import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PaymentAccountStatus {
  hasPaymentAccount: boolean | null;
  hasMercadoPago: boolean;
  hasStripe: boolean;
  isLoading: boolean;
}

/**
 * Hook para verificar se o usuário logado possui conta de pagamento conectada
 * (Mercado Pago ou Stripe) para receber comissões de afiliação.
 */
export function usePaymentAccountCheck(): PaymentAccountStatus {
  const { user } = useAuth();
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
        const { data, error } = await supabase.functions.invoke("admin-data", {
          body: { action: "user-gateway-status" },
        });

        if (error) throw error;

        setStatus({
          hasPaymentAccount: data?.hasPaymentAccount || false,
          hasMercadoPago: data?.hasMercadoPago || false,
          hasStripe: data?.hasStripe || false,
          isLoading: false,
        });
      } catch (err) {
        console.error("Erro ao verificar conta de pagamento:", err);
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
