/**
 * useProductsTable - Centralized hook for ProductsTable state and mutations
 * 
 * Usa React Query para cache de dados com staleTime de 2 minutos.
 * 
 * @see RISE Protocol V3 - Single Source of Truth + React Query
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createLogger } from "@/lib/logger";
const log = createLogger("useProductsTable");

import { api } from "@/lib/api";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useBusy } from "@/components/BusyProvider";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import { duplicateProductDeep } from "@/lib/products/duplicateProduct";
import { deleteProductCascade } from "@/lib/products/deleteProduct";
import type { Product, ProductTab } from "./types";

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

const productQueryKeys = {
  all: ['products'] as const,
  list: (userId: string | undefined) => [...productQueryKeys.all, 'list', userId] as const,
};

// ============================================================================
// HOOK
// ============================================================================

export function useProductsTable() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const busy = useBusy();
  const qc = useQueryClient();
  const { confirm, Bridge } = useConfirmDelete();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<ProductTab>("meus-produtos");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // ========================================================================
  // REACT QUERY - Products List com Cache
  // ========================================================================

  const { 
    data: products = [], 
    isLoading: loading,
    refetch: loadProducts,
  } = useQuery({
    queryKey: productQueryKeys.list(user?.id),
    queryFn: async () => {
      const { data, error } = await api.call<{
        products?: Product[];
        error?: string;
      }>('products-crud', { action: 'list', excludeDeleted: true });

      if (error) throw error;
      
      if (data?.products) {
        return data.products as Product[];
      } else if (data?.error) {
        throw new Error(data.error);
      }
      
      return [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutos em cache - navegação instantânea
    gcTime: 1000 * 60 * 5,    // 5 minutos no garbage collector
  });

  // ========================================================================
  // MUTATIONS
  // ========================================================================

  const duplicateMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await busy.run(
        async () => {
          const { newProductId } = await duplicateProductDeep(productId);
          return newProductId;
        },
        "Duplicando produto..."
      );
    },
    onSuccess: async () => {
      toast.success("Produto duplicado com sucesso!");
      await qc.invalidateQueries({ queryKey: productQueryKeys.all });
    },
    onError: (err: Error) => {
      log.error("Falha ao duplicar:", err);
      toast.error(`Falha ao duplicar: ${err?.message ?? "erro desconhecido"}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      // RISE V3: supabase client não é mais usado - Edge Function gerencia tudo
      await deleteProductCascade(null as never, productId);
    },
    onSuccess: () => {
      toast.success("Produto excluído com sucesso!");
      qc.invalidateQueries({ queryKey: productQueryKeys.all });
    },
    onError: (err: Error) => {
      log.error("Delete product error:", err);
      
      let errorMessage = "Erro ao excluir produto";
      
      if (err?.message?.includes('autorizado') || err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        errorMessage = "Sua sessão expirou. Faça login novamente.";
      } else if (err?.message?.includes('pedido')) {
        errorMessage = err.message;
      } else if (err?.message?.includes('foreign key')) {
        errorMessage = "Este produto possui dados vinculados e não pode ser excluído.";
      } else if (err?.message) {
        errorMessage = `Falha ao excluir: ${err.message}`;
      }
      
      toast.error(errorMessage);
    },
  });

  // ========================================================================
  // ACTION HANDLERS
  // ========================================================================

  const handleEdit = useCallback((productId: string) => {
    navigate(`/dashboard/produtos/editar?id=${productId}`);
  }, [navigate]);

  const handleDuplicate = useCallback((productId: string) => {
    duplicateMutation.mutate(productId);
  }, [duplicateMutation]);

  const handleDelete = useCallback(async (productId: string, productName: string) => {
    await confirm({
      resourceType: "Produto",
      resourceName: productName,
      requireTypeToConfirm: true,
      onConfirm: async () => {
        // RISE V3: Usar mutateAsync para que o dialog aguarde a conclusão
        // e exiba o spinner durante a operação
        await deleteMutation.mutateAsync(productId);
      },
    });
  }, [confirm, deleteMutation]);

  // ========================================================================
  // FILTERED PRODUCTS
  // ========================================================================

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === "all" || product.status === statusFilter)
  );

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // State
    products,
    loading,
    searchQuery,
    statusFilter,
    activeTab,
    isAddDialogOpen,
    filteredProducts,
    // Setters
    setSearchQuery,
    setStatusFilter,
    setActiveTab,
    setIsAddDialogOpen,
    // Actions
    handleEdit,
    handleDuplicate,
    handleDelete,
    loadProducts,
    // Mutations state
    duplicateIsPending: duplicateMutation.isPending,
    deleteIsPending: deleteMutation.isPending,
    // ConfirmDelete Bridge
    Bridge,
  };
}
