/**
 * KwaiPixelConfig
 * 
 * @version 2.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("KwaiPixelConfig");

interface KwaiIntegrationResponse {
  integration?: {
    config?: { pixel_id?: string } | null;
    active?: boolean;
  };
}

interface VaultSaveResponse {
  success?: boolean;
  error?: string;
}

export function KwaiPixelConfig() {
  const { user } = useAuth();
  const [pixelId, setPixelId] = useState("");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  /**
   * Load config via Edge Function
   * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
   */
  const loadConfig = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await api.call<KwaiIntegrationResponse>("admin-data", {
        action: "vendor-integration",
        integrationType: "KWAI_PIXEL",
      });

      if (error) throw error;

      const integration = data?.integration;
      if (integration) {
        const config = integration.config as { 
          pixel_id?: string;
        } | null;
        
        setPixelId(config?.pixel_id || "");
        setActive(integration.active || false);
      }
    } catch (error: unknown) {
      log.error("Error loading Kwai config:", error);
      toast.error("Erro ao carregar configuração do Kwai");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!pixelId.trim()) {
        toast.error("Pixel ID é obrigatório");
        return;
      }

      if (!user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const credentials: Record<string, unknown> = {
        pixel_id: pixelId.trim(),
      };

      const { data: result, error } = await api.call<VaultSaveResponse>("vault-save", {
        vendor_id: user.id,
        integration_type: "KWAI_PIXEL",
        credentials,
        active,
      });

      if (error) {
        throw new Error(error.message || "Erro ao salvar credenciais");
      }

      if (!result?.success) {
        throw new Error(result?.error || "Erro ao salvar credenciais");
      }

      toast.success("Configuração do Kwai salva com sucesso!");
    } catch (error: unknown) {
      log.error("Error saving Kwai config:", error);
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
            Kwai Pixel
          </h3>
          <p className="text-sm" style={{ color: "var(--subtext)" }}>
            Rastreamento de eventos e conversões do Kwai
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="kwai-active" style={{ color: "var(--text)" }}>
            Ativo
          </Label>
          <Switch id="kwai-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kwai-pixel-id" style={{ color: "var(--text)" }}>
            Pixel ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="kwai-pixel-id"
            type="text"
            placeholder="Ex: 1234567890"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs" style={{ color: "var(--subtext)" }}>
            Encontre seu Pixel ID no{" "}
            <a
              href="https://ads.kwai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Kwai Ads Manager
            </a>
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
