/**
 * Linha individual da tabela de clientes
 * 
 * RISE ARCHITECT PROTOCOL:
 * - Single Responsibility: Apenas renderização de uma linha
 * - Limite de 150 linhas: ✓
 */

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import type { Customer } from "./types";

interface CustomerTableRowProps {
  customer: Customer;
  displayPhone: ReactNode;
  onViewDetails: () => void;
}

export function CustomerTableRow({ customer, displayPhone, onViewDetails }: CustomerTableRowProps) {
  return (
    <TableRow className="hover:bg-muted/30 border-border/30 transition-colors group">
      <TableCell className="font-mono text-sm text-foreground/70 group-hover:text-foreground transition-colors">
        {customer.id}
      </TableCell>
      <TableCell className="text-sm font-medium text-foreground">
        {customer.offer}
      </TableCell>
      <TableCell className="text-sm text-foreground/80">
        {customer.client}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {displayPhone}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {customer.createdAt}
      </TableCell>
      <TableCell className="text-sm font-semibold text-foreground">
        {customer.value}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={`
            ${customer.status === "Pago" 
              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
              : customer.status === "Pendente"
              ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
              : customer.status === "Reembolso" || customer.status === "Chargeback"
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}
            transition-all
          `}
        >
          {customer.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-muted/50 hover:text-primary transition-all"
          onClick={onViewDetails}
        >
          <Eye className="w-4 h-4" />
          <span className="sr-only sm:not-sr-only sm:inline-block">Ver</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}
