/**
 * AdminOrdersTab - Gerenciamento de Pedidos
 * 
 * RISE Protocol V3 - XState Unified Architecture
 * Consome estado do AdminContext (Single Source of Truth)
 * 
 * @version 3.0.0
 */

import { useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination";
import { ShoppingCart, Search, RefreshCw, Download } from "lucide-react";
import { OrderDetailsDialog } from "@/components/dashboard/OrderDetailsDialog";
import { OrdersTable, OrderStats, type OrderStatsData } from "@/modules/admin/components/orders";
import { useAdminFilters, useAdminPagination } from "@/modules/admin/hooks";
import { useAdmin } from "@/modules/admin/context";
import { orderStatusService } from "@/lib/order-status/service";
import type { CustomerDisplayStatus } from "@/modules/dashboard/types";
import type { OrderSortField, SortDirection, AdminOrder } from "@/modules/admin/types/admin.types";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os Status" },
  { value: "pending", label: "Pendentes" },
  { value: "paid", label: "Pagos" },
  { value: "refunded", label: "Reembolsados" },
  { value: "chargeback", label: "Chargeback" },
];

export function AdminOrdersTab() {
  const { 
    context,
    isOrdersLoading,
    loadOrders,
    refreshOrders,
    selectOrder,
    deselectOrder,
    setOrdersSearch,
    setOrdersStatusFilter,
    setOrdersSort,
  } = useAdmin();

  const ordersContext = context.orders;
  const orders = ordersContext.items;

  // Load orders on mount if not loaded
  useEffect(() => {
    if (orders.length === 0 && !isOrdersLoading && !ordersContext.error) {
      loadOrders();
    }
  }, [orders.length, isOrdersLoading, ordersContext.error, loadOrders]);

  const { filteredItems, searchTerm, setSearchTerm } = useAdminFilters(
    orders,
    (order) => [order.orderId, order.customerName, order.customerEmail, order.productName],
    {}
  );

  const statusFilteredOrders = ordersContext.statusFilter === "all"
    ? filteredItems
    : filteredItems.filter((o) => o.status === ordersContext.statusFilter);

  const sortedOrders = useMemo(() => {
    return [...statusFilteredOrders].sort((a, b) => {
      const direction = ordersContext.sortDirection === "asc" ? 1 : -1;
      switch (ordersContext.sortField) {
        // CRITICAL: Use ISO date for reliable sorting (not formatted string)
        case "date": return direction * (new Date(a.createdAtISO).getTime() - new Date(b.createdAtISO).getTime());
        case "amount": return direction * (a.amountCents - b.amountCents);
        case "customer": return direction * a.customerName.localeCompare(b.customerName);
        default: return 0;
      }
    });
  }, [statusFilteredOrders, ordersContext.sortField, ordersContext.sortDirection]);

  const { paginatedItems, currentPage, totalPages, pageNumbers, goToPage, goToPrevious, goToNext } = 
    useAdminPagination(sortedOrders, 15);

  const stats: OrderStatsData = useMemo(() => ({
    totalOrders: orders.length,
    totalRevenue: orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amountCents, 0),
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    completedOrders: orders.filter((o) => o.status === "paid").length,
  }), [orders]);

  // Status já vem em inglês lowercase do banco - usar direto

  const handleSort = useCallback((field: OrderSortField) => {
    if (ordersContext.sortField === field) {
      const newDirection: SortDirection = ordersContext.sortDirection === "asc" ? "desc" : "asc";
      setOrdersSort(field, newDirection);
    } else {
      setOrdersSort(field, "desc");
    }
  }, [ordersContext.sortField, ordersContext.sortDirection, setOrdersSort]);

  const handleViewDetails = useCallback((orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      selectOrder(order);
    }
  }, [orders, selectOrder]);

  const handleRefresh = useCallback(() => {
    refreshOrders();
  }, [refreshOrders]);

  const handleExportExcel = useCallback(() => {
    const headers = ["ID", "Produto", "Cliente", "Email", "Valor", "Status", "Data"];
    const rows = filteredItems.map((order) => [
      order.orderId, order.productName, order.customerName, order.customerEmail,
      order.amount, order.status, order.createdAt,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `vendas_plataforma_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredItems]);

  // Sync search with context
  useEffect(() => {
    if (searchTerm !== ordersContext.searchTerm) {
      setOrdersSearch(searchTerm);
    }
  }, [searchTerm, ordersContext.searchTerm, setOrdersSearch]);

  return (
    <div className="space-y-6">
      <OrderStats stats={stats} isLoading={isOrdersLoading} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Gerenciar Pedidos
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />Exportar CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isOrdersLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isOrdersLoading ? "animate-spin" : ""}`} />Atualizar
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
            <Select value={ordersContext.statusFilter} onValueChange={setOrdersStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <OrdersTable 
            orders={paginatedItems}
            isLoading={isOrdersLoading} 
            sortField={ordersContext.sortField}
            sortDirection={ordersContext.sortDirection} 
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
                      {page === "ellipsis" ? <PaginationEllipsis /> : (
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
        open={!!ordersContext.selectedOrder}
        onOpenChange={(open) => !open && deselectOrder()}
        orderData={ordersContext.selectedOrder ? {
          id: ordersContext.selectedOrder.orderId,
          customerName: ordersContext.selectedOrder.customerName,
          customerEmail: ordersContext.selectedOrder.customerEmail,
          customerPhone: ordersContext.selectedOrder.customerPhone || "",
          customerDocument: ordersContext.selectedOrder.customerDocument || "",
          productName: ordersContext.selectedOrder.productName,
          productImageUrl: ordersContext.selectedOrder.productImageUrl || "",
          amount: ordersContext.selectedOrder.amount,
          status: orderStatusService.getDisplayLabel(ordersContext.selectedOrder.status) as CustomerDisplayStatus,
          createdAt: ordersContext.selectedOrder.createdAt,
        } : null}
        productOwnerId={ordersContext.selectedOrder?.productOwnerId} 
      />
    </div>
  );
}
