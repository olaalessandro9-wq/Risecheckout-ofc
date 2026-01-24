/**
 * Corpo da tabela de clientes (loading, empty, rows)
 * 
 * RISE ARCHITECT PROTOCOL:
 * - Single Responsibility: Renderização do corpo da tabela
 * - Limite de 150 linhas: ✓
 */

import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { CustomerTableRow } from "./CustomerTableRow";
import type { ReactNode } from "react";
import type { Customer } from "./types";

interface CustomerTableBodyProps {
  customers: Customer[];
  isLoading: boolean;
  searchTerm: string;
  getDisplayEmail: (customer: Customer) => ReactNode;
  onViewDetails: (customer: Customer) => void;
}

export function CustomerTableBody({
  customers,
  isLoading,
  searchTerm,
  getDisplayEmail,
  onViewDetails,
}: CustomerTableBodyProps) {
  if (isLoading) {
    return (
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i} className="border-border/30">
            <TableCell><Skeleton className="h-4 w-20 bg-primary/10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-primary/10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32 bg-primary/10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28 bg-primary/10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 bg-primary/10" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20 bg-primary/10" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16 bg-primary/10" /></TableCell>
            <TableCell><Skeleton className="h-8 w-24 bg-primary/10 ml-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  }

  if (customers.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={8} className="text-center py-12 border-border/30">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="p-4 bg-muted/30 rounded-full mb-2">
                <Search className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-base font-medium text-foreground">
                {searchTerm ? "Nenhum resultado encontrado" : "Nenhum cliente ainda"}
              </p>
              <p className="text-sm opacity-70">
                {searchTerm 
                  ? "Tente ajustar sua busca" 
                  : "Quando você tiver clientes, eles aparecerão aqui com suas compras."}
              </p>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody className="recent-customers-tbody">
      {customers.map((customer) => (
        <CustomerTableRow
          key={customer.id}
          customer={customer}
          displayEmail={getDisplayEmail(customer)}
          onViewDetails={() => onViewDetails(customer)}
        />
      ))}
    </TableBody>
  );
}
