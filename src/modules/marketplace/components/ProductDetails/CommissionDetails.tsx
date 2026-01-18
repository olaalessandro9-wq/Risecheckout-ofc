/**
 * CommissionDetails - Detalhes da Comissão
 * 
 * Responsabilidade única: Renderizar informações de comissão
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Separator } from "@/components/ui/separator";
import type { Offer } from "./hooks/useProductOffers";

interface CommissionDetailsProps {
  commissionPercentage: number | null;
  hasOrderBumpCommission: boolean | null;
  offers: Offer[];
}

export function CommissionDetails({
  commissionPercentage,
  hasOrderBumpCommission,
  offers,
}: CommissionDetailsProps) {
  return (
    <>
      <div className="py-2">
        <h3 className="text-sm font-medium text-foreground mb-2">
          Detalhes da Comissão
        </h3>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{commissionPercentage || 0}% em ofertas de preço único</span>
          </div>
          {offers.some((o) => o.type === "recurring") && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{commissionPercentage || 0}% em ofertas recorrentes</span>
            </div>
          )}
          {hasOrderBumpCommission && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Comissão também em Order Bumps e Upsells</span>
            </div>
          )}
        </div>
      </div>

      <Separator />
    </>
  );
}
