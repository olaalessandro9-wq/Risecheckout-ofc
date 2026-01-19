/**
 * ProductSettingsPanel - Painel de Configurações do Produto
 * 
 * MIGRADO para usar ProductContext (Reducer Pattern)
 * - Consome estado de formState.editedData.checkoutSettings
 * - Dispara actions via formDispatch
 * - Zero estado local duplicado
 * - Registra save handler via Registry Pattern
 */

import { useEffect, useCallback, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useProductContext } from "@/modules/products/context/ProductContext";
import { usePermissions } from "@/hooks/usePermissions";
import { getGatewayById, isGatewayAvailable } from "@/config/payment-gateways";
import { createLogger } from "@/lib/logger";

const log = createLogger("ProductSettingsPanel");

import {
  RequiredFieldsSection,
  PaymentMethodSection,
  GatewaySection,
  PixelsSection,
} from "./settings";
import type { ProductSettings, GatewayCredentials } from "./settings/types";

interface Props {
  productId: string;
}

export default function ProductSettingsPanel({ productId }: Props) {
  const { 
    checkoutSettingsForm, 
    checkoutCredentials,
    updateCheckoutSettingsField,
    initCheckoutSettings,
    formState,
    formDispatch,
  } = useProductContext();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { role, isLoading: permissionsLoading } = usePermissions();
  const isOwner = role === "owner";

  // Carregar configurações do servidor APENAS se ainda não foram inicializadas
  // Isso garante que ao navegar entre abas, as edições do usuário são preservadas
  useEffect(() => {
    // Se já inicializado, não recarrega (preserva edições do usuário)
    if (formState.isCheckoutSettingsInitialized) {
      return;
    }
    
    if (permissionsLoading || !productId) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        // Carregar credenciais
        let creds: GatewayCredentials = {};
        if (isOwner) {
          creds = {
            mercadopago: { configured: true, viaSecrets: true },
            pushinpay: { configured: true, viaSecrets: true },
            stripe: { configured: true, viaSecrets: true },
            asaas: { configured: true, viaSecrets: true },
          };
        }

        // Carregar settings do produto
        const { data, error } = await api.call<{
          settings?: {
            required_fields?: Record<string, boolean>;
            default_payment_method?: string;
            pix_gateway?: string;
            credit_card_gateway?: string;
          };
        }>('products-crud', { action: 'get-settings', productId });

        if (error) {
          log.error("Error loading settings:", error);
          toast.error("Erro ao carregar configurações.");
          return;
        }

        const s = data?.settings;
        const rf = (s?.required_fields as Record<string, boolean>) || {};
        
        initCheckoutSettings({
          required_fields: {
            name: true,
            email: true,
            phone: !!rf.phone,
            cpf: !!rf.cpf,
          },
          default_payment_method: (s?.default_payment_method as "pix" | "credit_card") || "pix",
          pix_gateway: s?.pix_gateway || "pushinpay",
          credit_card_gateway: s?.credit_card_gateway || "mercadopago",
        }, creds);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [productId, permissionsLoading, isOwner, initCheckoutSettings, formState.isCheckoutSettingsInitialized]);


  // Adapter: form e setForm para compatibilidade com sub-componentes
  const form: ProductSettings = checkoutSettingsForm;
  
  const setForm = useCallback((updater: React.SetStateAction<ProductSettings>) => {
    const newValue = typeof updater === 'function' ? updater(form) : updater;
    // Update each changed field
    if (JSON.stringify(newValue.required_fields) !== JSON.stringify(form.required_fields)) {
      updateCheckoutSettingsField('required_fields', newValue.required_fields);
    }
    if (newValue.default_payment_method !== form.default_payment_method) {
      updateCheckoutSettingsField('default_payment_method', newValue.default_payment_method);
    }
    if (newValue.pix_gateway !== form.pix_gateway) {
      updateCheckoutSettingsField('pix_gateway', newValue.pix_gateway);
    }
    if (newValue.credit_card_gateway !== form.credit_card_gateway) {
      updateCheckoutSettingsField('credit_card_gateway', newValue.credit_card_gateway);
    }
  }, [form, updateCheckoutSettingsField]);

  // Salvar (para uso local do botão)
  const executeSave = useCallback(async () => {
    const pixGateway = getGatewayById(form.pix_gateway);
    const ccGateway = getGatewayById(form.credit_card_gateway);

    if (!isGatewayAvailable(form.pix_gateway)) {
      throw new Error(`Gateway de PIX "${pixGateway?.displayName || form.pix_gateway}" não está disponível.`);
    }
    if (!isGatewayAvailable(form.credit_card_gateway)) {
      throw new Error(`Gateway de Cartão "${ccGateway?.displayName || form.credit_card_gateway}" não está disponível.`);
    }

    const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-settings', {
      action: 'update-settings',
      productId,
      settings: {
        required_fields: form.required_fields,
        default_payment_method: form.default_payment_method,
        pix_gateway: form.pix_gateway,
        credit_card_gateway: form.credit_card_gateway,
      },
    });

    if (error || !data?.success) {
      throw new Error(data?.error || "Erro ao salvar configurações.");
    }

    // Usar action específica que não tem guard - força atualização do serverData
    formDispatch({ type: "MARK_CHECKOUT_SETTINGS_SAVED", payload: { settings: form } });
  }, [form, productId, formDispatch]);

  // Handler para o botão local
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await executeSave();
      toast.success("Configurações salvas com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }, [executeSave]);

  // NOTA: O handler de save registry foi movido para useGlobalValidationHandlers
  // no ProductContext para garantir que a validação funcione independente
  // de qual aba está ativa. Este componente agora é apenas uma Pure View.

  // Loading: só mostra se ainda não foi inicializado OU se está carregando ativamente
  const isLoading = loading || permissionsLoading || (!formState.isCheckoutSettingsInitialized && !loading);

  if (isLoading && !formState.isCheckoutSettingsInitialized) {
    return (
      <Card className="border-muted">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted">
      <CardHeader>
        <CardTitle>Configurações do produto</CardTitle>
        <CardDescription>
          As alterações afetam o checkout público <strong>após salvar</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <RequiredFieldsSection form={form} setForm={setForm} />
        <PaymentMethodSection form={form} setForm={setForm} />
        <GatewaySection form={form} setForm={setForm} credentials={checkoutCredentials} />

        <Separator />

        <PixelsSection productId={productId} />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
