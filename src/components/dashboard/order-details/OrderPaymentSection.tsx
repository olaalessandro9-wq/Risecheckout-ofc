/**
 * OrderPaymentSection - Payment information section
 */

import { CreditCard, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StatusConfig } from "./types";

interface OrderPaymentSectionProps {
  amount: string;
  status: string;
  statusConfig: StatusConfig;
  createdAt: string;
}

export function OrderPaymentSection({ 
  amount, 
  status, 
  statusConfig, 
  createdAt 
}: OrderPaymentSectionProps) {
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <CreditCard className="w-3.5 h-3.5" />
        <span>Informações de Pagamento</span>
      </div>
      <div className="space-y-2">
        {/* Valor Total - cor padrão profissional */}
        <div className="p-3 rounded-lg border-2 border-border bg-background">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Valor Total</span>
            <span className="text-xl font-bold text-foreground">{amount}</span>
          </div>
        </div>

        {/* Status do Pagamento - único elemento com cores dinâmicas */}
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
          <span className="text-xs text-muted-foreground">Status do Pagamento</span>
          <Badge 
            className={`${statusConfig.color} border px-2 py-0.5 text-xs font-semibold`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        </div>

        {/* Data */}
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Data da Compra</span>
          </div>
          <span className="text-xs font-medium text-foreground">{createdAt}</span>
        </div>
      </div>
    </div>
  );
}
