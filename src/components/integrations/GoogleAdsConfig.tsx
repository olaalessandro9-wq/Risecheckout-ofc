/**
 * GoogleAdsConfig
 * 
 * Componente para configuração do Google Ads Conversion Tracking.
 * Segue o mesmo padrão do FacebookPixelConfig.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function GoogleAdsConfig() {
  const { user } = useAuth();
  const [conversionId, setConversionId] = useState("");
  const [conversionLabel, setConversionLabel] = useState("");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("vendor-integrations", {
        body: {
          action: "get",
          vendorId: user?.id,
          integrationType: "GOOGLE_ADS",
        },
      });

      if (error) throw error;

      if (data?.integration) {
        const config = data.integration.config as { 
          conversion_id?: string; 
          conversion_label?: string;
        } | null;
        
        setConversionId(config?.conversion_id || "");
        setConversionLabel(config?.conversion_label || "");
        setActive(data.integration.active || false);
      }
    } catch (error: unknown) {
      console.error("Error loading Google Ads config:", error);
      toast.error("Erro ao carregar configuração do Google Ads");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!conversionId.trim()) {
        toast.error("Conversion ID é obrigatório");
        return;
      }

      if (!user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const credentials: Record<string, unknown> = {
        conversion_id: conversionId.trim(),
        conversion_label: conversionLabel.trim() || undefined,
      };

      const { data: result, error } = await supabase.functions.invoke("vault-save", {
        body: {
          vendor_id: user.id,
          integration_type: "GOOGLE_ADS",
          credentials,
          active,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao salvar credenciais");
      }

      toast.success("Configuração do Google Ads salva com sucesso!");
    } catch (error: unknown) {
      console.error("Error saving Google Ads config:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar configuração: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Google Ads
          </h3>
          <p className="text-sm" style={{ color: "var(--subtext)" }}>
            Rastreamento de conversões do Google Ads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="gads-active" style={{ color: "var(--text)" }}>
            Ativo
          </Label>
          <Switch id="gads-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gads-conversion-id" style={{ color: "var(--text)" }}>
            Conversion ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="gads-conversion-id"
            type="text"
            placeholder="Ex: AW-1234567890"
            value={conversionId}
            onChange={(e) => setConversionId(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs" style={{ color: "var(--subtext)" }}>
            Encontre seu Conversion ID no{" "}
            <a
              href="https://ads.google.com/aw/conversions"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Google Ads → Conversões
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gads-conversion-label" style={{ color: "var(--text)" }}>
            Conversion Label (Opcional)
          </Label>
          <Input
            id="gads-conversion-label"
            type="text"
            placeholder="Ex: AbCdEfGhIjKlMnOpQrSt"
            value={conversionLabel}
            onChange={(e) => setConversionLabel(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs" style={{ color: "var(--subtext)" }}>
            Label específico para o evento de conversão de compra
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
