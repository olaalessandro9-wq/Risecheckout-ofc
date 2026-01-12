/**
 * Componente: PixelsSection
 * Seção de pixels nas configurações do produto
 */

import { BarChart3 } from "lucide-react";
import { ProductPixelsSelector } from "../ProductPixelsSelector";

interface PixelsSectionProps {
  productId: string;
}

export function PixelsSection({ productId }: PixelsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-medium">Pixels de Rastreamento</h3>
      </div>
      <ProductPixelsSelector productId={productId} />
    </div>
  );
}
