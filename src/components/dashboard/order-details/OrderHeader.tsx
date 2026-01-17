/**
 * OrderHeader - Header section of the order details dialog
 */

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";

interface OrderHeaderProps {
  orderId: string;
}

export function OrderHeader({ orderId }: OrderHeaderProps) {
  return (
    <div className="relative bg-muted/30 p-4 pb-5">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span>Detalhes da Compra</span>
        </DialogTitle>
      </DialogHeader>

      {/* ID da Compra em destaque */}
      <div className="mt-3 space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          ID da Compra
        </label>
        <p className="text-xs font-mono bg-background/50 backdrop-blur-sm p-2 rounded-lg border border-border/50 break-all">
          {orderId}
        </p>
      </div>
    </div>
  );
}
