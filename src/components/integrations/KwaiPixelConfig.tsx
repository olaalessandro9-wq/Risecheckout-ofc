/**
 * KwaiPixelConfig
 * 
 * Componente para configuração do Kwai Pixel.
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

  const loadConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendor_integrations")
        .select("*")
        .eq("vendor_id", user?.id)
        .eq("integration_type", "KWAI_PIXEL")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const config = data.config as { 
          pixel_id?: string;
        } | null;
        
        setPixelId(config?.pixel_id || "");
        setActive(data.active || false);
      }
    } catch (error: unknown) {
      console.error("Error loading Kwai config:", error);
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

      const { data: result, error } = await supabase.functions.invoke("vault-save", {
        body: {
          vendor_id: user.id,
          integration_type: "KWAI_PIXEL",
          credentials,
          active,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao salvar credenciais");
      }

      toast.success("Configuração do Kwai salva com sucesso!");
    } catch (error: unknown) {
      console.error("Error saving Kwai config:", error);
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
