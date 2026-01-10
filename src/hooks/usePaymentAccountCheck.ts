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
        const { data: profile } = await supabase
          .from("profiles")
          .select("mercadopago_collector_id, stripe_account_id")
          .eq("id", user.id)
          .maybeSingle();

        // Type-safe: campos existem no profiles após migração
        const hasMercadoPago = !!profile?.mercadopago_collector_id;
        const hasStripe = !!profile?.stripe_account_id;

        setStatus({
          hasPaymentAccount: hasMercadoPago || hasStripe,
          hasMercadoPago,
          hasStripe,
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
