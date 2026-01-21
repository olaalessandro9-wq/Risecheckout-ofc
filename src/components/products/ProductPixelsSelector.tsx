/**
 * Componente: ProductPixelsSelector
 * Permite vincular/desvincular pixels a um produto
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Plus, Settings2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { PlatformIcon, PLATFORM_INFO } from "@/modules/pixels";
import { useProductPixels } from "@/hooks/useProductPixels";
import type { VendorPixel } from "@/modules/pixels";

interface ProductPixelsSelectorProps {
  productId: string;
}

export function ProductPixelsSelector({ productId }: ProductPixelsSelectorProps) {
  const { vendorPixels, linkedPixels, isLoading, isSaving, linkPixel, unlinkPixel, updateLink } = useProductPixels(productId);
  const [expandedPixels, setExpandedPixels] = useState<Set<string>>(new Set());

  const isLinked = (pixelId: string) => linkedPixels.some(lp => lp.id === pixelId);
  const getLinkData = (pixelId: string) => linkedPixels.find(lp => lp.id === pixelId)?.link;

  const handleTogglePixel = async (pixel: VendorPixel) => {
    if (isLinked(pixel.id)) {
      const success = await unlinkPixel(pixel.id);
      if (success) {
        toast.success(`Pixel "${pixel.name}" desvinculado`);
        setExpandedPixels(prev => {
          const next = new Set(prev);
          next.delete(pixel.id);
          return next;
        });
      }
    } else {
      const success = await linkPixel({
        pixel_id: pixel.id,
        fire_on_initiate_checkout: true,
        fire_on_purchase: true,
        fire_on_pix: true,
        fire_on_card: true,
        fire_on_boleto: true,
        custom_value_percent: 100,
      });
      if (success) {
        toast.success(`Pixel "${pixel.name}" vinculado`);
        setExpandedPixels(prev => new Set(prev).add(pixel.id));
      }
    }
  };

  const handleUpdatePaymentMethod = async (pixelId: string, field: string, value: boolean) => {
    await updateLink(pixelId, { [field]: value });
  };

  const toggleExpanded = (pixelId: string) => {
    setExpandedPixels(prev => {
      const next = new Set(prev);
      if (next.has(pixelId)) {
        next.delete(pixelId);
      } else {
        next.add(pixelId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vendorPixels.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
        <p className="text-sm text-muted-foreground mb-3">
          Você ainda não tem pixels cadastrados.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/pixels">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Pixels
            <ExternalLink className="h-3 w-3 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Selecione os pixels que devem disparar eventos para este produto.
        </p>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/pixels">
            <Settings2 className="h-4 w-4 mr-1" />
            Gerenciar
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        {vendorPixels.map((pixel) => {
          const linked = isLinked(pixel.id);
          const linkData = getLinkData(pixel.id);
          const isExpanded = expandedPixels.has(pixel.id);
          const platformInfo = PLATFORM_INFO[pixel.platform];

          return (
            <Collapsible
              key={pixel.id}
              open={linked && isExpanded}
              onOpenChange={() => linked && toggleExpanded(pixel.id)}
            >
              <div className={`border rounded-lg transition-colors ${linked ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                {/* Linha principal */}
                <div className="flex items-center gap-3 p-3">
                  <Checkbox
                    id={`pixel-${pixel.id}`}
                    checked={linked}
                    onCheckedChange={() => handleTogglePixel(pixel)}
                    disabled={isSaving}
                  />
                  
                  <PlatformIcon platform={pixel.platform} size={18} />
                  
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`pixel-${pixel.id}`}
                      className="font-medium text-sm cursor-pointer"
                    >
                      {pixel.name}
                    </Label>
                    <p className="text-xs text-muted-foreground truncate">
                      {platformInfo.label} • {pixel.pixel_id}
                    </p>
                  </div>

                  {!pixel.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Inativo
                    </Badge>
                  )}

                  {linked && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>

                {/* Configurações expandidas */}
                <CollapsibleContent>
                  {linkData && (
                    <div className="px-3 pb-3 pt-1 border-t bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Disparar em:
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={linkData.fire_on_pix}
                            onCheckedChange={(checked) => 
                              handleUpdatePaymentMethod(pixel.id, 'fire_on_pix', !!checked)
                            }
                            disabled={isSaving}
                          />
                          PIX
                        </label>
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={linkData.fire_on_card}
                            onCheckedChange={(checked) => 
                              handleUpdatePaymentMethod(pixel.id, 'fire_on_card', !!checked)
                            }
                            disabled={isSaving}
                          />
                          Cartão
                        </label>
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <Checkbox
                            checked={linkData.fire_on_boleto}
                            onCheckedChange={(checked) => 
                              handleUpdatePaymentMethod(pixel.id, 'fire_on_boleto', !!checked)
                            }
                            disabled={isSaving}
                          />
                          Boleto
                        </label>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
