/**
 * AdminOrdersTab - Tab de todas as vendas da plataforma (apenas owner)
 * 
 * Exibe TODAS as vendas com:
 * - Lazy loading e paginação
 * - Dados sensíveis mascarados por padrão (clique para ver)
 * - Auditoria de acesso a dados sensíveis
 */

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, Download, Eye, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDetailsDialog } from "@/components/dashboard/OrderDetailsDialog";
import { useAdminOrders, AdminOrder } from "@/hooks/useAdminOrders";
import { PeriodFilter } from "@/hooks/useAdminAnalytics";

interface AdminOrdersTabProps {
  period: PeriodFilter;
}

const ITEMS_PER_PAGE = 15;

export function AdminOrdersTab({ period }: AdminOrdersTabProps) {
  const { data: orders = [], isLoading, refetch } = useAdminOrders(period);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrar pedidos por termo de busca
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;

    const term = searchTerm.toLowerCase();
    return orders.filter(order =>
      order.id.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.customerEmail.toLowerCase().includes(term) ||
      order.productName.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  // Obter pedidos da página atual
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  // Calcular range de páginas a exibir
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (totalPages <= 8) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxPagesToShow; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const handleViewDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Produto', 'Cliente', 'Email', 'Valor', 'Status', 'Data'];
    const rows = filteredOrders.map(order => [
      order.orderId,
      order.productName,
      order.customerName,
      order.customerEmail,
      order.amount,
      order.status,
      order.createdAt
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_plataforma_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Estatísticas rápidas
  const stats = useMemo(() => {
    const paid = filteredOrders.filter(o => o.status === "Pago");
    const pending = filteredOrders.filter(o => o.status === "Pendente");
    const totalRevenue = paid.reduce((sum, o) => sum + o.amountCents, 0);
    
    return {
      total: filteredOrders.length,
      paid: paid.length,
      pending: pending.length,
      revenue: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue / 100)
    };
  }, [filteredOrders]);

  return (
    <>
      <OrderDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        orderData={selectedOrder ? {
          id: selectedOrder.orderId,
          customerName: selectedOrder.customerName,
          customerEmail: selectedOrder.customerEmail,
          customerPhone: selectedOrder.customerPhone,
          customerDocument: selectedOrder.customerDocument,
          productName: selectedOrder.productName,
          productImageUrl: selectedOrder.productImageUrl,
          amount: selectedOrder.amount,
          status: selectedOrder.status,
          createdAt: selectedOrder.createdAt,
        } : null}
        productOwnerId={selectedOrder?.productOwnerId}
      />

      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita (Pagas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.revenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Todas as Vendas da Plataforma
                </CardTitle>
                <CardDescription>
                  Visualize todas as transações. Clique em "Ver" para acessar dados sensíveis com auditoria.
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={filteredOrders.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ShoppingCart className="w-8 h-8 opacity-50" />
                          <p>{searchTerm ? "Nenhum resultado encontrado" : "Nenhuma venda no período"}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((order) => (
                      <TableRow key={order.orderId} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{order.productName}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{order.customerEmail}</TableCell>
                        <TableCell className="font-semibold">{order.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={order.status === "Pago" ? "default" : "secondary"}
                            className={
                              order.status === "Pago"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : order.status === "Pendente"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{order.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {!isLoading && filteredOrders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-sm text-muted-foreground">
                <span>
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {pageNumbers.map((page, index) => {
                      if (page === 'ellipsis') return <span key={`ellipsis-${index}`} className="px-2">...</span>;

                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
