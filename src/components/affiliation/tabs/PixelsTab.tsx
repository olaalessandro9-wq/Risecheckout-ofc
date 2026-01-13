/**
 * PixelsTab - Gerenciamento de Pixels de Rastreamento do Afiliado
 * 
 * Migrado para usar Edge Function affiliate-pixel-management
 * @see RISE ARCHITECT PROTOCOL
 */

import { useState } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AffiliatePixel } from "@/hooks/useAffiliationDetails";

interface PixelsTabProps {
  affiliationId: string;
  initialPixels: AffiliatePixel[];
  onRefetch: () => Promise<void>;
}

type Platform = "facebook" | "google_ads" | "tiktok" | "kwai";

interface PixelForm {
  id?: string;
  pixel_id: string;
  domain: string;
  fire_on_pix: boolean;
  fire_on_boleto: boolean;
  fire_on_card: boolean;
  custom_value_pix: number;
  custom_value_boleto: number;
  custom_value_card: number;
  enabled: boolean;
  isNew?: boolean;
}

const platforms: { id: Platform; name: string; icon: string }[] = [
  { id: "facebook", name: "Facebook Pixel", icon: "🔵" },
  { id: "google_ads", name: "Google Ads", icon: "📊" },
  { id: "tiktok", name: "TikTok Pixel", icon: "🎵" },
  { id: "kwai", name: "Kwai Pixel", icon: "🟢" },
];

const defaultPixelForm: PixelForm = {
  pixel_id: "",
  domain: "",
  fire_on_pix: true,
  fire_on_boleto: true,
  fire_on_card: true,
  custom_value_pix: 100,
  custom_value_boleto: 100,
  custom_value_card: 100,
  enabled: true,
  isNew: true,
};

export function PixelsTab({ affiliationId, initialPixels, onRefetch }: PixelsTabProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>("facebook");
  const [pixelsByPlatform, setPixelsByPlatform] = useState<Record<Platform, PixelForm[]>>(() => {
    const initial: Record<Platform, PixelForm[]> = {
      facebook: [],
      google_ads: [],
      tiktok: [],
      kwai: [],
    };

    initialPixels.forEach((pixel) => {
      initial[pixel.platform].push({
        id: pixel.id,
        pixel_id: pixel.pixel_id,
        domain: pixel.domain || "",
        fire_on_pix: pixel.fire_on_pix,
        fire_on_boleto: pixel.fire_on_boleto,
        fire_on_card: pixel.fire_on_card,
        custom_value_pix: pixel.custom_value_pix,
        custom_value_boleto: pixel.custom_value_boleto,
        custom_value_card: pixel.custom_value_card,
        enabled: pixel.enabled,
      });
    });

    return initial;
  });
  const [isSaving, setIsSaving] = useState(false);

  const currentPixels = pixelsByPlatform[activePlatform];

  const addPixel = () => {
    if (currentPixels.length >= 50) {
      toast.error("Limite máximo de 50 pixels por plataforma");
      return;
    }

    setPixelsByPlatform(prev => ({
      ...prev,
      [activePlatform]: [...prev[activePlatform], { ...defaultPixelForm }],
    }));
  };

  const updatePixel = (index: number, field: keyof PixelForm, value: any) => {
    setPixelsByPlatform(prev => ({
      ...prev,
      [activePlatform]: prev[activePlatform].map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const removePixel = (index: number) => {
    setPixelsByPlatform(prev => ({
      ...prev,
      [activePlatform]: prev[activePlatform].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const sessionToken = localStorage.getItem('producer_session_token');
    if (!sessionToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    setIsSaving(true);

    try {
      // Construir array de todos os pixels
      const allPixels: Array<{
        pixel_id: string;
        platform: string;
        domain: string | null;
        fire_on_pix: boolean;
        fire_on_boleto: boolean;
        fire_on_card: boolean;
        custom_value_pix: number;
        custom_value_boleto: number;
        custom_value_card: number;
        enabled: boolean;
      }> = [];

      for (const platform of platforms) {
        const pixels = pixelsByPlatform[platform.id];
        for (const pixel of pixels) {
          if (pixel.pixel_id.trim()) {
            allPixels.push({
              pixel_id: pixel.pixel_id.trim(),
              platform: platform.id,
              domain: pixel.domain.trim() || null,
              fire_on_pix: pixel.fire_on_pix,
              fire_on_boleto: pixel.fire_on_boleto,
              fire_on_card: pixel.fire_on_card,
              custom_value_pix: pixel.custom_value_pix,
              custom_value_boleto: pixel.custom_value_boleto,
              custom_value_card: pixel.custom_value_card,
              enabled: pixel.enabled,
            });
          }
        }
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("affiliate-pixel-management", {
        headers: { "x-producer-token": sessionToken },
        body: {
          action: "save-all",
          affiliate_id: affiliationId,
          pixels: allPixels,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Pixels salvos com sucesso!");
      await onRefetch();
    } catch (err: any) {
      console.error("Erro ao salvar pixels:", err);
      toast.error(err.message || "Erro ao salvar pixels");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Pixels de Rastreamento</h3>
            <p className="text-sm text-muted-foreground">
              Configure seus pixels para rastrear conversões de suas vendas
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>

        <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)}>
          <TabsList className="mb-6">
            {platforms.map((platform) => (
              <TabsTrigger key={platform.id} value={platform.id} className="gap-2">
                <span>{platform.icon}</span>
                {platform.name}
                {pixelsByPlatform[platform.id].length > 0 && (
                  <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {pixelsByPlatform[platform.id].length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {platforms.map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="space-y-4">
              {pixelsByPlatform[platform.id].length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Nenhum pixel {platform.name} configurado
                  </p>
                  <Button onClick={addPixel} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Pixel
                  </Button>
                </div>
              ) : (
                <>
                  {pixelsByPlatform[platform.id].map((pixel, index) => (
                    <PixelCard
                      key={index}
                      pixel={pixel}
                      index={index}
                      platformId={platform.id}
                      updatePixel={updatePixel}
                      removePixel={removePixel}
                    />
                  ))}

                  <Button onClick={addPixel} variant="outline" className="gap-2 w-full">
                    <Plus className="h-4 w-4" />
                    Adicionar outro pixel
                  </Button>
                  <p className="text-xs text-muted-foreground text-right">
                    {pixelsByPlatform[platform.id].length}/50 pixels
                  </p>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// =====================================================
// SUBCOMPONENT: PixelCard
// =====================================================

interface PixelCardProps {
  pixel: PixelForm;
  index: number;
  platformId: Platform;
  updatePixel: (index: number, field: keyof PixelForm, value: any) => void;
  removePixel: (index: number) => void;
}

function PixelCard({ pixel, index, platformId, updatePixel, removePixel }: PixelCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <Label>Pixel ID</Label>
            <Input
              placeholder="Ex: 1234567890"
              value={pixel.pixel_id}
              onChange={(e) => updatePixel(index, "pixel_id", e.target.value)}
            />
          </div>
          {platformId === "facebook" && (
            <div>
              <Label>Domínio (opcional)</Label>
              <Input
                placeholder="Ex: seusite.com.br"
                value={pixel.domain}
                onChange={(e) => updatePixel(index, "domain", e.target.value)}
              />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => removePixel(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <PixelTriggerConfig
          label="Disparar no PIX"
          enabled={pixel.fire_on_pix}
          value={pixel.custom_value_pix}
          onEnabledChange={(v) => updatePixel(index, "fire_on_pix", v)}
          onValueChange={(v) => updatePixel(index, "custom_value_pix", v)}
        />

        <PixelTriggerConfig
          label="Disparar no Boleto"
          enabled={pixel.fire_on_boleto}
          value={pixel.custom_value_boleto}
          onEnabledChange={(v) => updatePixel(index, "fire_on_boleto", v)}
          onValueChange={(v) => updatePixel(index, "custom_value_boleto", v)}
        />

        <PixelTriggerConfig
          label="Disparar no Cartão"
          enabled={pixel.fire_on_card}
          value={pixel.custom_value_card}
          onEnabledChange={(v) => updatePixel(index, "fire_on_card", v)}
          onValueChange={(v) => updatePixel(index, "custom_value_card", v)}
        />
      </div>
    </div>
  );
}

// =====================================================
// SUBCOMPONENT: PixelTriggerConfig
// =====================================================

interface PixelTriggerConfigProps {
  label: string;
  enabled: boolean;
  value: number;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: number) => void;
}

function PixelTriggerConfig({ 
  label, 
  enabled, 
  value, 
  onEnabledChange, 
  onValueChange 
}: PixelTriggerConfigProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>
      {enabled && (
        <div>
          <Label className="text-xs text-muted-foreground">Valor de conversão (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onValueChange(parseInt(e.target.value) || 0)}
            className="h-8"
          />
        </div>
      )}
    </div>
  );
}
