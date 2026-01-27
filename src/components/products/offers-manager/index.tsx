/**
 * OffersManager - Componente Orquestrador
 * 
 * Gerencia as diferentes variações de preço de um produto.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Modularização
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOffersManager } from "./useOffersManager";
import { DefaultOfferCard } from "./DefaultOfferCard";
import { AdditionalOfferCard } from "./AdditionalOfferCard";
import { NewOfferCard } from "./NewOfferCard";
import type { OffersManagerProps } from "./types";

export function OffersManager({
  productId,
  offers,
  onOffersChange,
  onModifiedChange,
  onOfferDeleted,
  onOfferCreated,
  memberGroups = [],
  hasMembersArea = false,
}: OffersManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  
  const {
    errors,
    defaultOffer,
    additionalOffers,
    handleRemoveOffer,
    handleUpdateOffer,
  } = useOffersManager({
    offers,
    onOffersChange,
    onModifiedChange,
    onOfferDeleted,
  });

  const handleAddOfferClick = () => {
    setIsCreating(true);
  };

  const handleNewOfferSave = () => {
    setIsCreating(false);
    onOfferCreated?.();
  };

  const handleNewOfferCancel = () => {
    setIsCreating(false);
  };

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

        {/* CARD DE CRIAÇÃO DE NOVA OFERTA */}
        {isCreating && productId && (
          <NewOfferCard
            productId={productId}
            onSave={handleNewOfferSave}
            onCancel={handleNewOfferCancel}
            hasMembersArea={hasMembersArea}
            memberGroups={memberGroups}
          />
        )}

        {/* BOTÃO ADICIONAR NOVA OFERTA */}
        {!isCreating && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddOfferClick}
            className="w-full"
            disabled={!productId}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova Oferta
          </Button>
        )}
      </div>
    </div>
  );
}

// Re-export types para compatibilidade
export type { Offer, MemberGroupOption, OffersManagerProps } from "./types";
