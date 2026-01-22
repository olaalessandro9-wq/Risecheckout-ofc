/**
 * OffersLinkSection - Offer linking section for group access
 */

import { ShoppingCart, Tag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { OffersLinkSectionProps } from './types';

/** Format cents to BRL currency */
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function OffersLinkSection({
  offers,
  linkedOffers,
  linkedCount,
  onToggleOffer,
}: OffersLinkSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Ofertas que dão acesso a esse grupo</h4>
        </div>
        <span className="text-xs text-muted-foreground">
          {linkedCount} selecionada{linkedCount !== 1 ? 's' : ''}
        </span>
      </div>

      {offers.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
            <span>Oferta</span>
            <span className="text-right">Preço</span>
            <span className="w-8"></span>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={cn(
                  'grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 items-center cursor-pointer transition-colors',
                  linkedOffers[offer.id] 
                    ? 'bg-primary/5' 
                    : 'hover:bg-muted/30'
                )}
                onClick={() => onToggleOffer(offer.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{offer.name}</span>
                  {offer.is_default && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded shrink-0">
                      Principal
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-right">
                  {formatPrice(offer.price)}
                </span>
                <Checkbox 
                  checked={linkedOffers[offer.id] || false}
                  onCheckedChange={() => onToggleOffer(offer.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma oferta ativa para este produto</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Alunos que comprarem pelas ofertas selecionadas serão automaticamente adicionados a este grupo.
      </p>
    </div>
  );
}
