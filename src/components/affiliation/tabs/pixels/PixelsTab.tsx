/**
 * PixelsTab - Gerenciamento de Pixels de Rastreamento do Afiliado
 * 
 * Migrado para Vertical Slice Architecture
 * @see RISE ARCHITECT PROTOCOL V3
 * @module affiliation/tabs/pixels/PixelsTab
 */

import { Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AffiliatePixel } from "@/hooks/useAffiliationDetails";

import { PixelCard } from "./PixelCard";
import { usePixelsTabState } from "./usePixelsTabState";
import { PLATFORMS, type Platform } from "./types";

interface PixelsTabProps {
  affiliationId: string;
  initialPixels: AffiliatePixel[];
  onRefetch: () => Promise<void>;
}

export function PixelsTab({ affiliationId, initialPixels, onRefetch }: PixelsTabProps) {
  const {
    activePlatform,
    setActivePlatform,
    pixelsByPlatform,
    isSaving,
    addPixel,
    updatePixel,
    removePixel,
    handleSave,
  } = usePixelsTabState({ affiliationId, initialPixels, onRefetch });

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
            {PLATFORMS.map((platform) => (
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

          {PLATFORMS.map((platform) => (
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
