/**
 * AdminProductsTab - Gerenciamento de Produtos
 * 
 * RISE Protocol V3 Compliant - Refatorado para usar componentes e hooks modulares
 * 
 * @version 2.0.0
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Package, Search } from "lucide-react";
import { toast } from "sonner";
import { ProductDetailSheet } from "./ProductDetailSheet";
import {
  ProductsTable,
  ProductActionDialog,
} from "@/modules/admin/components/products";
import {
  useAdminFilters,
  useAdminSort,
  useAdminPagination,
  createProductComparator,
} from "@/modules/admin/hooks";
import type {
  ProductWithMetrics,
  ProductSortField,
  ProductStatusFilter,
} from "@/modules/admin/types/admin.types";

const STATUS_OPTIONS: { value: ProductStatusFilter; label: string }[] = [
  { value: "all", label: "Todos os Status" },
  { value: "active", label: "Ativos" },
  { value: "blocked", label: "Bloqueados" },
  { value: "deleted", label: "Removidos" },
];

export function AdminProductsTab() {
  const { role: callerRole } = usePermissions();
  const queryClient = useQueryClient();
  const isOwner = callerRole === "owner";

  // State
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    productId: string;
    productName: string;
    action: "activate" | "block" | "delete";
  } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products-global"],
    queryFn: async () => {
      const { data, error } = await api.call<{ error?: string; products?: ProductWithMetrics[] }>(
        "admin-data",
        { action: "admin-products-global" }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.products || [];
    },
    enabled: isOwner,
  });

  // Mutation para alterar status do produto
  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: string }) => {
      const { data, error } = await api.call<{ error?: string }>("manage-user-status", {
        action: "updateProductStatus",
        productId,
        status: newStatus,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-global"] });
      toast.success("Produto atualizado com sucesso!");
      setActionDialog(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar produto");
      setActionDialog(null);
    },
  });

  // Hooks modulares
  const { filteredItems, searchTerm, setSearchTerm } = useAdminFilters(
    products,
    (product) => [product.name, product.vendor_name || "", product.id],
    {}
  );

  // Filtro por status
  const statusFilteredProducts = statusFilter === "all"
    ? filteredItems
    : filteredItems.filter((p) => p.status === statusFilter);

  const { sortedItems, sortField, sortDirection, toggleSort } = useAdminSort<
    ProductWithMetrics,
    ProductSortField
  >(statusFilteredProducts, "gmv", "desc", createProductComparator());

  const {
    paginatedItems,
    currentPage,
    totalPages,
    pageNumbers,
    goToPage,
    goToPrevious,
    goToNext,
  } = useAdminPagination(sortedItems, 15);

  // Handlers
  const handleViewDetails = useCallback((productId: string) => {
    setSelectedProductId(productId);
  }, []);

  const handleActivate = useCallback((productId: string, productName: string) => {
    setActionDialog({ open: true, productId, productName, action: "activate" });
  }, []);

  const handleBlock = useCallback((productId: string, productName: string) => {
    setActionDialog({ open: true, productId, productName, action: "block" });
  }, []);

  const handleDelete = useCallback((productId: string, productName: string) => {
    setActionDialog({ open: true, productId, productName, action: "delete" });
  }, []);

  const handleConfirmAction = useCallback(() => {
    if (!actionDialog) return;

    const statusMap = {
      activate: "active",
      block: "blocked",
      delete: "deleted",
    };

    updateProductMutation.mutate({
      productId: actionDialog.productId,
      newStatus: statusMap[actionDialog.action],
    });
  }, [actionDialog, updateProductMutation]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gerenciar Produtos
            </CardTitle>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, ID ou vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ProductStatusFilter)}
            >
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
          <ProductsTable
            products={paginatedItems}
            isLoading={isLoading}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={toggleSort}
            onViewDetails={handleViewDetails}
            onActivate={handleActivate}
            onBlock={handleBlock}
            onDelete={handleDelete}
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

      {actionDialog && (
        <ProductActionDialog
          open={actionDialog.open}
          productName={actionDialog.productName}
          action={actionDialog.action}
          onConfirm={handleConfirmAction}
          onCancel={() => setActionDialog(null)}
        />
      )}

      {selectedProductId && (
        <ProductDetailSheet
          productId={selectedProductId}
          open={!!selectedProductId}
          onOpenChange={(open) => !open && setSelectedProductId(null)}
        />
      )}
    </div>
  );
}
