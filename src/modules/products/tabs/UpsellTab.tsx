/**
 * UpsellTab - Aba de Configurações de Upsell/Downsell
 * 
 * Refatorado seguindo RISE ARCHITECT PROTOCOL V3:
 * - Estado vem do Context via Reducer
 * - Tab é Pure View - consome estado do Context
 * 
 * @see RISE ARCHITECT PROTOCOL V3
 */

import { useLayoutEffect, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useProductContext } from "../context/ProductContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function UpsellTab() {
  const { 
    product,
    formState,
    dispatchForm,
    updateUpsellModified,
    saving,
    saveAll,
    hasUnsavedChanges
  } = useProductContext();

  // Estado vem do reducer
  const localSettings = formState.editedData.upsell;
  const serverSettings = formState.serverData.upsell;
  const isInitialized = formState.isInitialized;

  // URL error (UI state, não form data)
  const [urlError, setUrlError] = useState<string | null>(null);

  // Validar URL
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  // Detectar mudanças comparando com serverData
  const hasChanges = useMemo(() => {
    if (!isInitialized) return false;
    return JSON.stringify(localSettings) !== JSON.stringify(serverSettings);
  }, [localSettings, serverSettings, isInitialized]);

  // Notificar context sobre mudanças
  useLayoutEffect(() => {
    if (isInitialized) {
      updateUpsellModified(hasChanges);
    }
  }, [hasChanges, updateUpsellModified, isInitialized]);
  
  const handleChange = useCallback((field: 'hasCustomThankYouPage' | 'customPageUrl' | 'redirectIgnoringOrderBumpFailures', value: string | boolean) => {
    dispatchForm({ 
      type: 'UPDATE_UPSELL', 
      payload: { [field]: value } 
    });
    if (field === 'customPageUrl') {
      setUrlError(null);
    }
  }, [dispatchForm]);

  const handleSave = useCallback(async () => {
    if (localSettings.hasCustomThankYouPage) {
      const url = localSettings.customPageUrl.trim();
      
      if (!url) {
        setUrlError("URL é obrigatória quando a página personalizada está ativa");
        toast.error("Informe a URL da página de obrigado");
        return;
      }
      
      if (!isValidUrl(url)) {
        setUrlError("URL inválida. Use o formato: https://exemplo.com/pagina");
        toast.error("URL inválida");
        return;
      }
    }
    
    setUrlError(null);
    
    try {
      const { api } = await import("@/lib/api");
      
      const { data, error } = await api.call<{ success?: boolean; error?: string }>('product-settings', {
        action: 'update-upsell-settings',
        productId: product?.id,
        upsellSettings: localSettings,
      });
      
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Falha ao salvar');
      
      dispatchForm({ type: 'MARK_SAVED' });
      updateUpsellModified(false);
      
      toast.success("Configurações de upsell salvas com sucesso");
    } catch (error: unknown) {
      console.error("Erro ao salvar upsell:", error);
      toast.error("Não foi possível salvar as configurações");
    }
  }, [localSettings, product?.id, dispatchForm, updateUpsellModified]);

  if (!product?.id) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Upsell / Downsell</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Esse produto tem uma página de obrigado personalizada ou upsell
        </p>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="customThankYou"
                checked={localSettings.hasCustomThankYouPage}
                onCheckedChange={(checked) => 
                  handleChange('hasCustomThankYouPage', checked)
                }
              />
              <Label htmlFor="customThankYou" className="text-foreground cursor-pointer">
                Usar página de obrigado personalizada
              </Label>
            </div>

            {localSettings.hasCustomThankYouPage && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="customPageUrl" className="text-foreground">
                  URL da página de obrigado
                </Label>
                <Input
                  id="customPageUrl"
                  value={localSettings.customPageUrl}
                  onChange={(e) => handleChange('customPageUrl', e.target.value)}
                  className={cn(
                    "bg-background border-border text-foreground",
                    urlError && "border-destructive"
                  )}
                  placeholder="https://exemplo.com/obrigado"
                />
                {urlError ? (
                  <p className="text-xs text-destructive">{urlError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Após a compra, o cliente será redirecionado para esta URL
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-border">
        <div />
        <Button 
          onClick={saveAll}
          disabled={saving || !hasUnsavedChanges}
          className="bg-primary hover:bg-primary/90"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>
    </div>
  );
}
