/**
 * TikTokPixelConfig
 * 
 * Componente para configuração do TikTok Pixel.
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

export function TikTokPixelConfig() {
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
   * Carrega configuração via Edge Function
   * MIGRATED: Uses vendor-integrations Edge Function
   */
  const loadConfig = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke("vendor-integrations", {
        body: {
          action: "get",
          vendorId: user?.id,
          integrationType: "TIKTOK_PIXEL",
        },
      });

      if (error) throw error;

      if (data?.integration) {
        const integration = data.integration;
        const config = integration.config as { 
          pixel_id?: string; 
          has_token?: boolean;
        } | null;
        
        setPixelId(config?.pixel_id || "");
        setHasExistingToken(config?.has_token || false);
        setActive(integration.active || false);
        setAccessToken("");
      }
    } catch (error: unknown) {
      console.error("Error loading TikTok config:", error);
      toast.error("Erro ao carregar configuração do TikTok");
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

      const { data: result, error } = await supabase.functions.invoke("vault-save", {
        body: {
          vendor_id: user.id,
          integration_type: "TIKTOK_PIXEL",
          credentials,
          active,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao salvar credenciais");
      }

      if (accessToken.trim()) {
        setHasExistingToken(true);
        setAccessToken("");
      }

      toast.success("Configuração do TikTok salva com sucesso!");
    } catch (error: unknown) {
      console.error("Error saving TikTok config:", error);
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
            TikTok Pixel
          </h3>
          <p className="text-sm" style={{ color: "var(--subtext)" }}>
            Rastreamento de eventos e conversões do TikTok
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="tiktok-active" style={{ color: "var(--text)" }}>
            Ativo
          </Label>
          <Switch id="tiktok-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tiktok-pixel-id" style={{ color: "var(--text)" }}>
            Pixel ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="tiktok-pixel-id"
            type="text"
            placeholder="Ex: CXXXXXXXXXXXXXXXXX"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs" style={{ color: "var(--subtext)" }}>
            Encontre seu Pixel ID no{" "}
            <a
              href="https://ads.tiktok.com/marketing_api/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              TikTok Ads Manager
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tiktok-access-token" style={{ color: "var(--text)" }}>
            Access Token (Opcional) {hasExistingToken && <span className="text-muted-foreground">(já configurado)</span>}
          </Label>
          <Input
            id="tiktok-access-token"
            type="password"
            placeholder={hasExistingToken ? "••••••••••••••••" : "Para Events API"}
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs" style={{ color: "var(--subtext)" }}>
            {hasExistingToken 
              ? "Token já salvo de forma segura. Deixe em branco para manter o atual."
              : "Necessário apenas para rastreamento server-side (Events API)"
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
