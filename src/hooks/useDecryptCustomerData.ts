import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DecryptedData {
  customer_phone: string | null;
  customer_document: string | null;
}

interface UseDecryptCustomerDataReturn {
  decryptedData: DecryptedData | null;
  isLoading: boolean;
  error: string | null;
  decrypt: (orderId: string) => Promise<void>;
  reset: () => void;
}

export function useDecryptCustomerData(): UseDecryptCustomerDataReturn {
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decrypt = async (orderId: string) => {
    if (!orderId) {
      setError("ID do pedido não informado");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("decrypt-customer-data", {
        body: { order_id: orderId },
      });

      if (fnError) {
        throw new Error(fnError.message || "Erro ao descriptografar dados");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Falha na descriptografia");
      }

      setDecryptedData(data.data);
    } catch (err: any) {
      console.error("[useDecryptCustomerData] Error:", err);
      setError(err.message || "Erro ao acessar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDecryptedData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    decryptedData,
    isLoading,
    error,
    decrypt,
    reset,
  };
}
