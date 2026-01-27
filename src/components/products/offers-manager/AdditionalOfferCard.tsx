/**
 * Card de Oferta Adicional
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Puro
 * @see Auto-save com debounce para ofertas existentes
 */

import { Trash2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { MemberGroupSelect } from "./MemberGroupSelect";
import { useAutoSaveOffer } from "./useAutoSaveOffer";
import type { Offer, OfferError, MemberGroupOption } from "./types";

interface AdditionalOfferCardProps {
  offer: Offer;
  error?: OfferError;
  onUpdate: (field: keyof Offer, value: Offer[keyof Offer]) => void;
  onRemove: () => void;
  hasMembersArea: boolean;
  memberGroups: MemberGroupOption[];
}

export function AdditionalOfferCard({
  offer,
  error,
  onUpdate,
  onRemove,
  hasMembersArea,
  memberGroups,
}: AdditionalOfferCardProps) {
  // Auto-save hook para ofertas existentes
  const { isSaving, showSavedIndicator } = useAutoSaveOffer({
    offerId: offer.id,
    currentName: offer.name,
    currentPrice: offer.price,
    currentMemberGroupId: offer.member_group_id,
  });

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-background/50">
      <div className="flex items-start justify-between">
        {/* Indicador de Auto-Save */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isSaving && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Salvando...</span>
            </>
          )}
          {showSavedIndicator && !isSaving && (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Salvo</span>
            </>
          )}
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`offer-name-${offer.id}`}>
            Nome da Oferta
          </Label>
          <Input
            id={`offer-name-${offer.id}`}
            value={offer.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="Ex: Plano Premium"
            className={error?.name ? "border-destructive" : ""}
          />
          {error?.name && (
            <p className="text-xs text-destructive">{error.name}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Este nome será usado para gerar o link de pagamento
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`offer-price-${offer.id}`}>
            Preço
          </Label>
          <CurrencyInput
            id={`offer-price-${offer.id}`}
            value={offer.price}
            onChange={(value) => onUpdate('price', value)}
            className={error?.price ? "border-destructive" : ""}
          />
          {error?.price && (
            <p className="text-xs text-destructive">{error.price}</p>
          )}
        </div>
      </div>

      {hasMembersArea && memberGroups.length > 0 && (
        <MemberGroupSelect
          offerId={offer.id}
          value={offer.member_group_id}
          onChange={(value) => onUpdate('member_group_id', value)}
          memberGroups={memberGroups}
        />
      )}
    </div>
  );
}
