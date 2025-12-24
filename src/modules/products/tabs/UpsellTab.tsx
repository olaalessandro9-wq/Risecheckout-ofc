/**
 * UpsellTab - Aba de Configurações de Upsell/Downsell
 * 
 * Esta aba gerencia:
 * - Página de obrigado customizada
 * - URL de redirecionamento após compra
 * - Comportamento em caso de falha de order bump
 * 
 * IMPORTANTE: Requer coluna upsell_settings (JSONB) na tabela products.
 * Execute no Supabase Dashboard:
 * ALTER TABLE products ADD COLUMN IF NOT EXISTS upsell_settings JSONB DEFAULT '{}'::jsonb;
 */

import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
    upsellSettings, 
    updateUpsellSettings,
    saveUpsellSettings,
    updateUpsellModified,
    saving
  } = useProductContext();

  const [localSettings, setLocalSettings] = useState(upsellSettings);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  // Referência para o snapshot inicial (para comparar mudanças)
  const snapshotRef = useRef<string>("");

  // Validar URL
  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  // Sincronizar com Context quando mudar e atualizar snapshot
  useEffect(() => {
    setLocalSettings(upsellSettings);
    snapshotRef.current = JSON.stringify(upsellSettings);
  }, [upsellSettings]);

  // Detectar mudanças comparando com snapshot
  useLayoutEffect(() => {
    const currentJson = JSON.stringify(localSettings);
    const hasChanges = currentJson !== snapshotRef.current;
    updateUpsellModified(hasChanges);
  }, [localSettings, updateUpsellModified]);

  const handleChange = (field: keyof typeof upsellSettings, value: any) => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    if (field === 'customPageUrl') {
      setUrlError(null); // Limpa erro ao digitar
    }
  };

  const handleSave = async () => {
    // Validação: Se ativou página customizada, URL é obrigatória e válida
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
      // Salvar diretamente passando localSettings
      await saveUpsellSettings(localSettings);
      
      // Atualizar snapshot após salvar
      snapshotRef.current = JSON.stringify(localSettings);
      updateUpsellModified(false);
      
      toast.success("Configurações de upsell salvas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar upsell:", error);
      toast.error("Não foi possível salvar as configurações");
    }
  };

  // Verificar se há mudanças comparando com snapshot
  const hasChanges = JSON.stringify(localSettings) !== snapshotRef.current;

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
          {/* Página de Obrigado Customizada */}
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

      {/* Botão Salvar */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <div />
        <Button 
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-primary hover:bg-primary/90"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
