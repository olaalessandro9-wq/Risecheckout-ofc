/**
 * Hook para gerenciar carregamento e salvamento de configurações do produto
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getGatewayById, isGatewayAvailable, type PaymentMethod } from "@/config/payment-gateways";
import { usePermissions } from "@/hooks/usePermissions";
import type { ProductSettings, GatewayCredentials } from "./types";

const DEFAULT_SETTINGS: ProductSettings = {
  required_fields: { name: true, email: true, phone: false, cpf: false },
  default_payment_method: "pix",
  pix_gateway: "pushinpay",
  credit_card_gateway: "mercadopago",
};

interface UseProductSettingsReturn {
  loading: boolean;
  saving: boolean;
  credentials: GatewayCredentials;
  initial: ProductSettings;
  form: ProductSettings;
  setForm: React.Dispatch<React.SetStateAction<ProductSettings>>;
  handleSave: () => Promise<void>;
  hasChanges: boolean;
}

export function useProductSettings(
  productId: string,
  onModifiedChange?: (modified: boolean) => void
): UseProductSettingsReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<GatewayCredentials>({});
  const [initial, setInitial] = useState<ProductSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState<ProductSettings>(DEFAULT_SETTINGS);
  
  const { role } = usePermissions();
  const isOwner = role === "owner";

  // Carregar credenciais do usuário
  const loadCredentials = useCallback(async (userId: string) => {
    // Owner: todas as credenciais vêm das Secrets - sempre configuradas
    if (isOwner) {
      setCredentials({
        mercadopago: { configured: true, viaSecrets: true },
        pushinpay: { configured: true, viaSecrets: true },
        stripe: { configured: true, viaSecrets: true },
        asaas: { configured: true, viaSecrets: true },
      });
      return;
    }

    // Demais: buscar em vendor_integrations
    try {
      const [mpResult, ppResult, stripeResult, asaasResult] = await Promise.all([
        supabase
          .from("vendor_integrations")
          .select("id")
          .eq("vendor_id", userId)
          .eq("integration_type", "MERCADOPAGO")
          .eq("active", true)
          .maybeSingle(),
        supabase
          .from("payment_gateway_settings")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("vendor_integrations")
          .select("id")
          .eq("vendor_id", userId)
          .eq("integration_type", "STRIPE")
          .eq("active", true)
          .maybeSingle(),
        supabase
          .from("vendor_integrations")
          .select("id")
          .eq("vendor_id", userId)
          .eq("integration_type", "ASAAS")
          .eq("active", true)
          .maybeSingle(),
      ]);

      setCredentials({
        mercadopago: { configured: !!mpResult.data },
        pushinpay: { configured: !!ppResult.data },
        stripe: { configured: !!stripeResult.data },
        asaas: { configured: !!asaasResult.data },
      });
    } catch (error) {
      console.error("Error loading credentials:", error);
    }
  }, [isOwner]);

  // Carregar configurações do produto
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [productResult, checkoutResult] = await Promise.all([
        supabase
          .from("products")
          .select("required_fields, default_payment_method, user_id")
          .eq("id", productId)
          .maybeSingle(),
        supabase
          .from("checkouts")
          .select("pix_gateway, credit_card_gateway")
          .eq("product_id", productId)
          .eq("is_default", true)
          .maybeSingle(),
      ]);

      if (productResult.error || checkoutResult.error) {
        console.error("Error loading settings:", productResult.error || checkoutResult.error);
        toast.error("Erro ao carregar configurações.");
        return;
      }

      if (productResult.data?.user_id) {
        await loadCredentials(productResult.data.user_id);
      }

      const rf = (productResult.data?.required_fields as Record<string, boolean>) || {};
      const loadedSettings: ProductSettings = {
        required_fields: {
          name: true,
          email: true,
          phone: !!rf.phone,
          cpf: !!rf.cpf,
        },
        default_payment_method: (productResult.data?.default_payment_method as PaymentMethod) || "pix",
        pix_gateway: checkoutResult.data?.pix_gateway || "pushinpay",
        credit_card_gateway: checkoutResult.data?.credit_card_gateway || "mercadopago",
      };

      setInitial(loadedSettings);
      setForm(loadedSettings);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Erro inesperado ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [productId, loadCredentials]);

  // Salvar configurações
  const handleSave = useCallback(async () => {
    const pixGateway = getGatewayById(form.pix_gateway);
    const ccGateway = getGatewayById(form.credit_card_gateway);

    if (!isGatewayAvailable(form.pix_gateway)) {
      toast.error(`Gateway de PIX "${pixGateway?.displayName || form.pix_gateway}" não está disponível.`);
      return;
    }

    if (!isGatewayAvailable(form.credit_card_gateway)) {
      toast.error(`Gateway de Cartão "${ccGateway?.displayName || form.credit_card_gateway}" não está disponível.`);
      return;
    }

    setSaving(true);
    try {
      const [productResult, checkoutResult] = await Promise.all([
        supabase
          .from("products")
          .update({
            required_fields: {
              name: true,
              email: true,
              phone: form.required_fields.phone,
              cpf: form.required_fields.cpf,
            },
            default_payment_method: form.default_payment_method,
          })
          .eq("id", productId),
        supabase
          .from("checkouts")
          .update({
            pix_gateway: form.pix_gateway as "pushinpay" | "mercadopago",
            credit_card_gateway: form.credit_card_gateway as "mercadopago",
          })
          .eq("product_id", productId)
          .eq("is_default", true),
      ]);

      if (productResult.error) {
        console.error("Error saving product:", productResult.error);
        toast.error("Erro ao salvar configurações do produto.");
        return;
      }

      if (checkoutResult.error) {
        console.error("Error saving checkout:", checkoutResult.error);
        toast.error("Erro ao salvar configurações de gateway.");
        return;
      }

      toast.success("Configurações salvas com sucesso.");
      setInitial(form);
      onModifiedChange?.(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }, [form, productId, onModifiedChange]);

  // Carregar ao montar
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Detectar mudanças
  const hasChanges = JSON.stringify(initial) !== JSON.stringify(form);

  useEffect(() => {
    onModifiedChange?.(hasChanges);
  }, [hasChanges, onModifiedChange]);

  return {
    loading,
    saving,
    credentials,
    initial,
    form,
    setForm,
    handleSave,
    hasChanges,
  };
}
