/**
 * FacebookPixelConfig
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";

interface VendorIntegrationResponse {
  integration?: {
    active: boolean;
    config: {
      pixel_id?: string;
      has_token?: boolean;
    } | null;
  };
}

interface VaultSaveResponse {
  success: boolean;
  error?: string;
}

export function FacebookPixelConfig() {
  const { user } = useAuth();
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);

  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  /**
   * Load config via Edge Function
   * MIGRATED: Uses api.call instead of supabase.functions.invoke
   */
  const loadConfig = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await api.call<VendorIntegrationResponse>("admin-data", {
        action: "vendor-integration",
        integrationType: "FACEBOOK_PIXEL",
      });

      if (error) throw new Error(error.message);

      const integration = data?.integration;
      if (integration) {
        const config = integration.config;
        
        setPixelId(config?.pixel_id || "");
        setHasExistingToken(config?.has_token || false);
        setActive(integration.active || false);
        setAccessToken("");
      }
    } catch (error: unknown) {
      console.error("Error loading config:", error);
      toast.error("Erro ao carregar configuração");
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

      if (accessToken.trim()) {
        credentials.access_token = accessToken.trim();
        credentials.has_token = true;
      } else if (hasExistingToken) {
        credentials.has_token = true;
      }

      const { data: result, error } = await api.call<VaultSaveResponse>("vault-save", {
        vendor_id: user.id,
        integration_type: "FACEBOOK_PIXEL",
        credentials,
        active,
      });

      if (error) {
        throw new Error(error.message || "Erro ao salvar credenciais");
      }

      if (!result?.success) {
        throw new Error(result?.error || "Erro ao salvar credenciais");
      }

      if (accessToken.trim()) {
        setHasExistingToken(true);
        setAccessToken("");
      }

      toast.success("Configuração salva com sucesso!");
    } catch (error: unknown) {
      console.error("Error saving config:", error);
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
            Facebook Pixel
          </h3>
          <p className="text-sm" style={{ color: "var(--subtext)" }}>
            Rastreamento de eventos e conversões
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="fb-active" style={{ color: "var(--text)" }}>
            Ativo
          </Label>
          <Switch id="fb-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pixel-id" style={{ color: "var(--text)" }}>
            Pixel ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pixel-id"
            type="text"
            placeholder="Ex: 1234567890123456"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs" style={{ color: "var(--subtext)" }}>
            Encontre seu Pixel ID no{" "}
            <a
              href="https://business.facebook.com/events_manager2"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Gerenciador de Eventos
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="access-token" style={{ color: "var(--text)" }}>
            Access Token (Opcional) {hasExistingToken && <span className="text-muted-foreground">(já configurado)</span>}
          </Label>
          <Input
            id="access-token"
            type="password"
            placeholder={hasExistingToken ? "••••••••••••••••" : "Para Conversions API"}
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs" style={{ color: "var(--subtext)" }}>
            {hasExistingToken 
              ? "Token já salvo de forma segura. Deixe em branco para manter o atual ou digite um novo para substituir."
              : "Necessário apenas para rastreamento server-side (Conversions API)"
            }
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
