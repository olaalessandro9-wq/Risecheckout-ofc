/**
 * UserMetricsSection - Seção de métricas totais do usuário
 * 
 * RISE Protocol V3 - Componente puro
 * 
 * @version 1.0.0
 */

import { DollarSign } from "lucide-react";
import { formatCentsToBRL } from "../../types/admin.types";

interface UserMetricsSectionProps {
  totalGmv: number;
  totalFees: number;
  ordersCount: number;
}

export function UserMetricsSection({
  totalGmv,
  totalFees,
  ordersCount,
}: UserMetricsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        Métricas Totais
      </h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-lg font-semibold text-emerald-500">
            {formatCentsToBRL(totalGmv)}
          </p>
          <p className="text-xs text-muted-foreground">GMV Total</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-lg font-semibold text-blue-500">
            {formatCentsToBRL(totalFees)}
          </p>
          <p className="text-xs text-muted-foreground">Taxa Paga</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-lg font-semibold">{ordersCount}</p>
          <p className="text-xs text-muted-foreground">Pedidos</p>
        </div>
      </div>
    </div>
  );
}
