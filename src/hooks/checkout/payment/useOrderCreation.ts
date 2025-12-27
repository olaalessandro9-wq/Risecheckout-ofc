/**
 * useOrderCreation - Hook para criação de pedidos
 * 
 * Responsabilidade ÚNICA: Criar pedidos no banco via create-order
 * 
 * Menos de 100 linhas. Single Responsibility.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAffiliateCode } from "@/hooks/useAffiliateTracking";
import type { 
  CreateOrderPayload, 
  CreateOrderResult, 
  PaymentConfig, 
  AppliedCoupon 
} from "./types";
import type { PaymentMethod } from "@/types/checkout";

/**
 * Override de dados pessoais para blindar contra state desatualizado.
 * Quando fornecido, esses dados têm PRIORIDADE TOTAL sobre config.formData.
 */
export interface PersonalDataOverride {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
}

interface UseOrderCreationProps {
  config: PaymentConfig;
}

interface UseOrderCreationReturn {
  createOrder: (
    paymentMethod: PaymentMethod,
    gateway: string,
    selectedBumps: Set<string>,
    orderBumps: any[],
    appliedCoupon: AppliedCoupon | null,
    personalDataOverride?: PersonalDataOverride
  ) => Promise<CreateOrderResult>;
  isCreating: boolean;
  error: string | null;
}

export function useOrderCreation({ config }: UseOrderCreationProps): UseOrderCreationReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (
    paymentMethod: PaymentMethod,
    gateway: string,
    selectedBumps: Set<string>,
    orderBumps: any[],
    appliedCoupon: AppliedCoupon | null,
    personalDataOverride?: PersonalDataOverride
  ): Promise<CreateOrderResult> => {
    setIsCreating(true);
    setError(null);

    try {
      // Construir lista de order bump IDs selecionados
      const orderBumpIds = orderBumps
        .filter(b => selectedBumps.has(b.id))
        .map(b => b.id);

      // ✅ FIX CRÍTICO: Override tem PRIORIDADE TOTAL sobre config.formData
      // Isso garante que os dados do DOM snapshot sejam usados, não o state stale
      const customerName = personalDataOverride?.name || config.formData.name;
      const customerEmail = personalDataOverride?.email || config.formData.email;
      const customerPhone = personalDataOverride?.phone || config.formData.phone;
      const customerCpf = personalDataOverride?.cpf || config.formData.cpf || config.formData.document;

      console.log("[useOrderCreation] Criando pedido...", {
        gateway,
        paymentMethod,
        bumpsCount: orderBumpIds.length,
        hasCoupon: !!appliedCoupon,
        usingOverride: !!personalDataOverride,
        customerEmail, // Log para debug
      });

      const payload: CreateOrderPayload = {
        product_id: config.productId,
        offer_id: config.offerId || config.productId,
        checkout_id: config.checkoutId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        customer_cpf: customerCpf?.replace(/\D/g, '') || null,
        order_bump_ids: orderBumpIds,
        gateway: gateway.toUpperCase(),
        payment_method: paymentMethod,
        coupon_id: appliedCoupon?.id || null,
        affiliate_code: getAffiliateCode()
      };

      const { data, error: invokeError } = await supabase.functions.invoke("create-order", {
        body: payload
      });

      if (invokeError) {
        throw new Error("Erro ao criar pedido. Tente novamente.");
      }

      if (!data?.success || !data?.order_id) {
        throw new Error(data?.error || "Erro ao criar pedido.");
      }

      console.log("[useOrderCreation] ✅ Pedido criado:", data.order_id);

      return {
        success: true,
        order_id: data.order_id,
        access_token: data.access_token
      };
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao criar pedido";
      console.error("[useOrderCreation] ❌ Erro:", errorMessage);
      setError(errorMessage);
      return {
        success: false,
        order_id: '',
        access_token: '',
        error: errorMessage
      };
    } finally {
      setIsCreating(false);
    }
  }, [config]);

  return {
    createOrder,
    isCreating,
    error
  };
}
