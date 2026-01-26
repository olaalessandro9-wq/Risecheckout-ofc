/**
 * useDecryptCustomerData
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("UseDecryptCustomerData");

interface DecryptCustomerDataResponse {
  success?: boolean;
  error?: string;
  data?: DecryptedData;
  access_type?: "vendor" | "admin";
}

interface DecryptedData {
  customer_phone: string | null;
  customer_document: string | null;
}

interface UseDecryptCustomerDataReturn {
  decryptedData: DecryptedData | null;
  isLoading: boolean;
  error: string | null;
  accessType: "vendor" | "admin" | null;
  decrypt: (orderId: string) => Promise<void>;
  reset: () => void;
}

interface UseDecryptCustomerDataOptions {
  /** Se true, dispara decrypt automaticamente quando orderId mudar */
  autoDecrypt?: boolean;
  /** ID do pedido para auto-decrypt */
  orderId?: string;
}

export function useDecryptCustomerData(
  options?: UseDecryptCustomerDataOptions
): UseDecryptCustomerDataReturn {
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<"vendor" | "admin" | null>(null);

  const decrypt = useCallback(async (orderId: string) => {
    if (!orderId) {
      setError("ID do pedido não informado");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await api.call<DecryptCustomerDataResponse>("decrypt-customer-data", {
        order_id: orderId,
      });

      if (fnError) {
        const errorMessage = typeof fnError === 'object' && fnError !== null && 'message' in fnError
          ? String(fnError.message)
          : "Erro ao descriptografar dados";
        throw new Error(errorMessage);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Falha na descriptografia");
      }

      setDecryptedData(data.data);
      setAccessType(data.access_type || null);
    } catch (err: unknown) {
      log.error("Error:", err);
      setError(err instanceof Error ? err.message : "Erro ao acessar dados");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDecryptedData(null);
    setError(null);
    setIsLoading(false);
    setAccessType(null);
  }, []);

  // Auto-decrypt quando habilitado e orderId presente
  useEffect(() => {
    if (options?.autoDecrypt && options?.orderId && !decryptedData && !isLoading && !error) {
      decrypt(options.orderId);
    }
  }, [options?.autoDecrypt, options?.orderId, decrypt, decryptedData, isLoading, error]);

  return {
    decryptedData,
    isLoading,
    error,
    accessType,
    decrypt,
    reset,
  };
}
