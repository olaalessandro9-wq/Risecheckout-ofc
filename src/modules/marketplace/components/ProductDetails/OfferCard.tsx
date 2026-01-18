/**
 * OfferCard - Card Individual de Oferta
 * 
 * Responsabilidade única: Renderizar uma única oferta
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "./utils";
import type { Offer } from "./hooks/useProductOffers";

interface OfferCardProps {
  offer: Offer;
}

export function OfferCard({ offer }: OfferCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm text-foreground">{offer.name}</span>
        {offer.type === "recurring" && (
          <Badge variant="secondary" className="text-xs">
            Recorrente
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Valor</span>
        <span className="font-medium text-foreground">{formatPrice(offer.price)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Você recebe</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatPrice(offer.commission)}
        </span>
      </div>
    </div>
  );
}
