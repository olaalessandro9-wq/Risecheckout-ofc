/**
 * OrderProductSection - Product information section
 */

import { Package } from "lucide-react";

interface OrderProductSectionProps {
  productName: string;
  productImageUrl: string;
}

export function OrderProductSection({ productName, productImageUrl }: OrderProductSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Package className="w-3.5 h-3.5" />
        <span>Produto</span>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
        <div className="relative">
          <img 
            src={productImageUrl} 
            alt={productName}
            className="w-14 h-14 rounded-md object-cover border border-border shadow-sm"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{productName}</p>
          <p className="text-xs text-muted-foreground">Produto digital</p>
        </div>
      </div>
    </div>
  );
}
