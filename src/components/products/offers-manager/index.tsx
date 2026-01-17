/**
 * OffersManager - Componente Orquestrador
 * 
 * Gerencia as diferentes variações de preço de um produto.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOffersManager } from "./useOffersManager";
import { DefaultOfferCard } from "./DefaultOfferCard";
import { AdditionalOfferCard } from "./AdditionalOfferCard";
import type { OffersManagerProps } from "./types";

export function OffersManager({
  offers,
  onOffersChange,
  onModifiedChange,
  onOfferDeleted,
  memberGroups = [],
  hasMembersArea = false,
}: OffersManagerProps) {
  const {
    errors,
    defaultOffer,
    additionalOffers,
    handleAddOffer,
    handleRemoveOffer,
    handleUpdateOffer,
  } = useOffersManager({
    offers,
    onOffersChange,
    onModifiedChange,
    onOfferDeleted,
  });

  return (
    <div className="border-t border-border pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Ofertas</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as diferentes variações de preço deste produto
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Quando ativado, você poderá criar múltiplas ofertas com preços diferentes. Cada oferta gerará um link de pagamento único automaticamente.
        </p>
      </div>

      <div className="space-y-3">
        {/* OFERTA PRINCIPAL */}
        {defaultOffer && (
          <DefaultOfferCard
            offer={defaultOffer}
            error={errors[defaultOffer.id]}
            onUpdate={(field, value) => handleUpdateOffer(defaultOffer.id, field, value)}
            hasMembersArea={hasMembersArea}
            memberGroups={memberGroups}
          />
        )}

        {/* OFERTAS ADICIONAIS */}
        {additionalOffers.map((offer) => (
          <AdditionalOfferCard
            key={offer.id}
            offer={offer}
            error={errors[offer.id]}
            onUpdate={(field, value) => handleUpdateOffer(offer.id, field, value)}
            onRemove={() => handleRemoveOffer(offer.id)}
            hasMembersArea={hasMembersArea}
            memberGroups={memberGroups}
          />
        ))}

        {/* BOTÃO ADICIONAR NOVA OFERTA */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddOffer}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Nova Oferta
        </Button>
      </div>
    </div>
  );
}

// Re-export types para compatibilidade
export type { Offer, MemberGroupOption, OffersManagerProps } from "./types";
