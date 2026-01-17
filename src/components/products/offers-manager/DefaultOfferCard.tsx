/**
 * Card da Oferta Principal
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Componente Puro
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import { MemberGroupSelect } from "./MemberGroupSelect";
import type { Offer, OfferError, MemberGroupOption } from "./types";

interface DefaultOfferCardProps {
  offer: Offer;
  error?: OfferError;
  onUpdate: (field: keyof Offer, value: Offer[keyof Offer]) => void;
  hasMembersArea: boolean;
  memberGroups: MemberGroupOption[];
}

export function DefaultOfferCard({
  offer,
  error,
  onUpdate,
  hasMembersArea,
  memberGroups,
}: DefaultOfferCardProps) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-background/50">
      <div className="flex items-start justify-between">
        <Badge variant="default" className="mb-2">
          Oferta Principal
        </Badge>
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
            placeholder="Ex: Plano Básico"
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
