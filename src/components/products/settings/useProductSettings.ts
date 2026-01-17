/**
 * Hook para gerenciar carregamento e salvamento de configurações do produto
 * 
 * MIGRADO para Edge Function: product-settings (action: update-settings)
 */

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
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
  
  const { role, isLoading: permissionsLoading } = usePermissions();
  const isOwner = role === "owner";

  /**
   * Load credentials via Edge Function
   * MIGRATED: Uses api.call instead of supabase.functions.invoke
   */
  const loadCredentials = useCallback(async (_userId: string) => {
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

    // MIGRATED: Use api.call
    try {
      const { data, error } = await api.call<{ credentials?: GatewayCredentials }>('products-crud', {
        action: 'check-credentials'
      });

      if (error) {
        console.error("Error checking credentials via Edge Function:", error);
        return;
      }

      if (data?.credentials) {
        setCredentials(data.credentials);
      }
    } catch (error: unknown) {
      console.error("Error loading credentials:", error);
    }
  }, [isOwner]);

  /**
   * Load product settings via Edge Function
   * MIGRATED: Uses products-crud Edge Function
   */
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await api.call<{
        settings?: {
          user_id?: string;
          required_fields?: Record<string, boolean>;
          default_payment_method?: string;
          pix_gateway?: string;
          credit_card_gateway?: string;
        };
        error?: string;
      }>('products-crud', { action: 'get-settings', productId });

      if (error) {
        console.error("Error loading settings via Edge Function:", error);
        toast.error("Erro ao carregar configurações.");
        return;
      }

      if (data?.error) {
        console.error("API error:", data.error);
        toast.error("Erro ao carregar configurações.");
        return;
      }

      const productResult = data?.settings;

      if (productResult?.user_id) {
        await loadCredentials(productResult.user_id);
      }

      const rf = (productResult?.required_fields as Record<string, boolean>) || {};
      const loadedSettings: ProductSettings = {
        required_fields: {
          name: true,
          email: true,
          phone: !!rf.phone,
          cpf: !!rf.cpf,
        },
        default_payment_method: (productResult?.default_payment_method as PaymentMethod) || "pix",
        pix_gateway: productResult?.pix_gateway || "mercadopago",
        credit_card_gateway: productResult?.credit_card_gateway || "mercadopago",
      };

      setInitial(loadedSettings);
      setForm(loadedSettings);
    } catch (error: unknown) {
      console.error("Unexpected error:", error);
      toast.error("Erro inesperado ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [productId, loadCredentials]);

  // Salvar configurações via Edge Function
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
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-settings', {
        action: 'update-settings',
        productId,
        settings: {
          required_fields: {
            name: true,
            email: true,
            phone: form.required_fields.phone,
            cpf: form.required_fields.cpf,
          },
          default_payment_method: form.default_payment_method,
          pix_gateway: form.pix_gateway,
          credit_card_gateway: form.credit_card_gateway,
        },
      });

      if (error) {
        console.error("Error saving via Edge Function:", error);
        toast.error("Erro ao salvar configurações.");
        return;
      }

      if (!data?.success) {
        console.error("API error:", data?.error);
        toast.error(data?.error || "Erro ao salvar configurações.");
        return;
      }

      toast.success("Configurações salvas com sucesso.");
      setInitial(form);
      onModifiedChange?.(false);
    } catch (error: unknown) {
      console.error("Unexpected error:", error);
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }, [form, productId, onModifiedChange]);

  // Carregar ao montar - APENAS quando permissões estiverem prontas
  useEffect(() => {
    if (!permissionsLoading && productId) {
      loadSettings();
    }
  }, [loadSettings, permissionsLoading, productId]);
  
  // Loading combinado: aguarda permissões E configurações
  const isFullyLoading = loading || permissionsLoading;

  // Detectar mudanças
  const hasChanges = JSON.stringify(initial) !== JSON.stringify(form);

  useEffect(() => {
    onModifiedChange?.(hasChanges);
  }, [hasChanges, onModifiedChange]);

  return {
    loading: isFullyLoading,
    saving,
    credentials,
    initial,
    form,
    setForm,
    handleSave,
    hasChanges,
  };
}
