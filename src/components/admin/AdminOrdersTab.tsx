/**
 * AdminOrdersTab - Gerenciamento de Pedidos
 * 
 * RISE Protocol V3 Compliant - Refatorado para usar componentes e hooks modulares
 * 
 * @version 2.0.0
 */

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ShoppingCart, Search, RefreshCw, Download } from "lucide-react";
import { OrderDetailsDialog } from "@/components/dashboard/OrderDetailsDialog";
import { useAdminOrders, AdminOrder } from "@/hooks/useAdminOrders";
import { PeriodFilter } from "@/hooks/useAdminAnalytics";
import {
  OrdersTable,
  OrderStats,
  type OrderStatsData,
} from "@/modules/admin/components/orders";
import {
  useAdminFilters,
  useAdminPagination,
} from "@/modules/admin/hooks";
import type { OrderSortField, SortDirection } from "@/modules/admin/types/admin.types";

interface AdminOrdersTabProps {
  period: PeriodFilter;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os Status" },
  { value: "Pendente", label: "Pendentes" },
  { value: "Pago", label: "Pagos" },
  { value: "Cancelado", label: "Cancelados" },
  { value: "Reembolsado", label: "Reembolsados" },
  { value: "Expirado", label: "Expirados" },
];

export function AdminOrdersTab({ period }: AdminOrdersTabProps) {
  const { data: orders = [], isLoading, refetch } = useAdminOrders(period);

  // State
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<OrderSortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hooks modulares
  const { filteredItems, searchTerm, setSearchTerm } = useAdminFilters(
    orders,
    (order) => [order.orderId, order.customerName, order.customerEmail, order.productName],
    {}
  );

  // Filtro por status
  const statusFilteredOrders = statusFilter === "all"
    ? filteredItems
    : filteredItems.filter((o) => o.status === statusFilter);

  // Ordenação
  const sortedOrders = useMemo(() => {
    return [...statusFilteredOrders].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      
      switch (sortField) {
        case "date":
          return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case "amount":
          return direction * (a.amountCents - b.amountCents);
        case "customer":
          return direction * a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });
  }, [statusFilteredOrders, sortField, sortDirection]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageNumbers,
    goToPage,
    goToPrevious,
    goToNext,
  } = useAdminPagination(sortedOrders, 15);

  // Estatísticas
  const stats: OrderStatsData = useMemo(() => ({
    totalOrders: orders.length,
    totalRevenue: orders
      .filter((o) => o.status === "Pago")
      .reduce((sum, o) => sum + o.amountCents, 0),
    pendingOrders: orders.filter((o) => o.status === "Pendente").length,
    completedOrders: orders.filter((o) => o.status === "Pago").length,
  }), [orders]);

  // Transform orders for OrdersTable
  const transformedOrders = paginatedItems.map((order) => ({
    ...order,
    id: order.id,
    orderId: order.orderId,
    status: order.status.toLowerCase(),
  }));

  // Handlers
  const handleSort = useCallback((field: OrderSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  const handleViewDetails = useCallback((orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setIsDialogOpen(true);
    }
  }, [orders]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleExportExcel = useCallback(() => {
    const headers = ["ID", "Produto", "Cliente", "Email", "Valor", "Status", "Data"];
    const rows = filteredItems.map((order) => [
      order.orderId,
      order.productName,
      order.customerName,
      order.customerEmail,
      order.amount,
      order.status,
      order.createdAt,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_plataforma_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      <OrderStats stats={stats} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Gerenciar Pedidos
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <OrdersTable
            orders={transformedOrders}
            isLoading={isLoading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onViewDetails={handleViewDetails}
          />

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={goToPrevious}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {pageNumbers.map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => goToPage(page as number)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={goToNext}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        orderData={selectedOrder ? {
          id: selectedOrder.orderId,
          customerName: selectedOrder.customerName,
          customerEmail: selectedOrder.customerEmail,
          customerPhone: selectedOrder.customerPhone || "",
          customerDocument: selectedOrder.customerDocument || "",
          productName: selectedOrder.productName,
          productImageUrl: selectedOrder.productImageUrl || "",
          amount: selectedOrder.amount,
          status: selectedOrder.status as "Pago" | "Pendente" | "Reembolso" | "Chargeback",
          createdAt: selectedOrder.createdAt,
        } : null}
        productOwnerId={selectedOrder?.productOwnerId}
      />
    </div>
  );
}
