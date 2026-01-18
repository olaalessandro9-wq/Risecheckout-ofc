/**
 * OffersList - Lista de Ofertas
 * 
 * Responsabilidade única: Renderizar lista de ofertas com toggle "Ver mais"
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { OfferCard } from "./OfferCard";
import type { Offer } from "./hooks/useProductOffers";

interface OffersListProps {
  offers: Offer[];
}

export function OffersList({ offers }: OffersListProps) {
  const [showAllOffers, setShowAllOffers] = useState(false);

  if (offers.length === 0) {
    return null;
  }

  const visibleOffers = showAllOffers ? offers : offers.slice(0, 2);

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">
          Ofertas disponíveis ({offers.length})
        </h3>
        {offers.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 text-primary hover:text-primary/80"
            onClick={() => setShowAllOffers(!showAllOffers)}
          >
            {showAllOffers ? (
              <>
                Ver menos <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Ver mais <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {visibleOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
