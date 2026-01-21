/**
 * AdminProductsTab - Gerenciamento de Produtos
 * 
 * RISE Protocol V3 - XState Unified Architecture
 * Consome estado do AdminContext (Single Source of Truth)
 * 
 * @version 3.0.0
 */

import { useCallback, useEffect } from "react";
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
import { useAdmin } from "@/modules/admin/context";
import type {
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
  const isOwner = callerRole === "owner";

  const {
    context,
    isProductsLoading,
    loadProducts,
    selectProduct,
    deselectProduct,
    setProductsSearch,
    setProductsStatusFilter,
    openProductAction,
    confirmProductAction,
    cancelProductAction,
  } = useAdmin();

  const productsContext = context.products;
  const products = productsContext.items;

  // REMOVED: Duplicate loading useEffect - AdminContext manages initial loading
  // This prevents race conditions and duplicate requests

  // Hooks modulares
  const { filteredItems, searchTerm, setSearchTerm } = useAdminFilters(
    products,
    (product) => [product.name, product.vendor_name || "", product.id],
    {}
  );

  // Filtro por status
  const statusFilteredProducts = productsContext.statusFilter === "all"
    ? filteredItems
    : filteredItems.filter((p) => p.status === productsContext.statusFilter);

  const { sortedItems, sortField, sortDirection, toggleSort } = useAdminSort<
    typeof products[0],
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

  // Sync search with context
  useEffect(() => {
    if (searchTerm !== productsContext.searchTerm) {
      setProductsSearch(searchTerm);
    }
  }, [searchTerm, productsContext.searchTerm, setProductsSearch]);

  // Handlers
  const handleViewDetails = useCallback((productId: string) => {
    selectProduct(productId);
  }, [selectProduct]);

  const handleActivate = useCallback((productId: string, productName: string) => {
    openProductAction({ open: true, productId, productName, action: "activate" });
  }, [openProductAction]);

  const handleBlock = useCallback((productId: string, productName: string) => {
    openProductAction({ open: true, productId, productName, action: "block" });
  }, [openProductAction]);

  const handleDelete = useCallback((productId: string, productName: string) => {
    openProductAction({ open: true, productId, productName, action: "delete" });
  }, [openProductAction]);

  const handleConfirmAction = useCallback(async () => {
    try {
      await confirmProductAction();
      toast.success("Produto atualizado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar produto");
    }
  }, [confirmProductAction]);

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
              value={productsContext.statusFilter}
              onValueChange={(v) => setProductsStatusFilter(v as ProductStatusFilter)}
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
            isLoading={isProductsLoading}
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

      {productsContext.actionDialog && (
        <ProductActionDialog
          open={productsContext.actionDialog.open}
          productName={productsContext.actionDialog.productName}
          action={productsContext.actionDialog.action}
          onConfirm={handleConfirmAction}
          onCancel={cancelProductAction}
        />
      )}

      {productsContext.selectedProductId && (
        <ProductDetailSheet
          productId={productsContext.selectedProductId}
          open={!!productsContext.selectedProductId}
          onOpenChange={(open) => !open && deselectProduct()}
        />
      )}
    </div>
  );
}
