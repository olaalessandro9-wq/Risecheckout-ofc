/**
 * OrdersTable - Tabela de Pedidos Admin
 * 
 * Componente puro que exibe a tabela de pedidos com ações.
 * 
 * @version 1.1.0 - RISE V3 Compliant
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, ArrowUpDown } from "lucide-react";
import type { AdminOrder, OrderSortField, SortDirection } from "@/modules/admin/types/admin.types";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/modules/admin/types/admin.types";

interface OrdersTableProps {
  orders: AdminOrder[];
  isLoading: boolean;
  sortField: OrderSortField;
  sortDirection: SortDirection;
  onSort: (field: OrderSortField) => void;
  onViewDetails: (orderId: string) => void;
}

export function OrdersTable({
  orders,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  onViewDetails,
}: OrdersTableProps) {
  const SortButton = ({ field, children }: { field: OrderSortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === field ? "opacity-100" : "opacity-50"}`} />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum pedido encontrado com os filtros selecionados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID do Pedido</TableHead>
          <TableHead>
            <SortButton field="customer">Cliente</SortButton>
          </TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <SortButton field="amount">Valor</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="date">Data</SortButton>
          </TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-sm">
              {order.orderId.slice(0, 8)}...
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              </div>
            </TableCell>
            <TableCell className="max-w-[150px] truncate">
              {order.productName}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={ORDER_STATUS_COLORS[order.status] || "bg-muted"}
              >
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{order.amount}</TableCell>
            <TableCell>
              {order.fullCreatedAt}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(order.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
