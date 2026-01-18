/**
 * PixelCard - Individual pixel configuration card
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Single Responsibility
 * @module affiliation/tabs/pixels/PixelCard
 */

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PixelTriggerConfig } from "./PixelTriggerConfig";
import type { PixelForm, Platform } from "./types";

interface PixelCardProps {
  pixel: PixelForm;
  index: number;
  platformId: Platform;
  updatePixel: (index: number, field: keyof PixelForm, value: string | Platform | boolean | number) => void;
  removePixel: (index: number) => void;
}

export function PixelCard({ pixel, index, platformId, updatePixel, removePixel }: PixelCardProps) {
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
