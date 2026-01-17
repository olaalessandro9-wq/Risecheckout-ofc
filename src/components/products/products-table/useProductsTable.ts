/**
 * useProductsTable - Centralized hook for ProductsTable state and mutations
 * 
 * @see RISE Protocol V3 - Single Source of Truth
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useBusy } from "@/components/BusyProvider";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import { duplicateProductDeep } from "@/lib/products/duplicateProduct";
import { deleteProductCascade } from "@/lib/products/deleteProduct";
import type { Product, ProductTab } from "./types";

export function useProductsTable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const busy = useBusy();
  const qc = useQueryClient();
  const { confirm, Bridge } = useConfirmDelete();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<ProductTab>("meus-produtos");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await api.call<{
        products?: Product[];
        error?: string;
      }>('products-crud', { action: 'list', excludeDeleted: true });

      if (error) throw error;
      
      if (data?.products) {
        setProducts(data.products as Product[]);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      toast.error("Erro ao carregar produtos");
      console.error('[ProductsTable] Load error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const duplicateMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await busy.run(
        async () => {
          const { newProductId } = await duplicateProductDeep(supabase, productId);
          return newProductId;
        },
        "Duplicando produto..."
      );
    },
    onSuccess: async () => {
      toast.success("Produto duplicado com sucesso!");
      await loadProducts();
      await qc.invalidateQueries({ queryKey: ["products:list"] });
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(`Falha ao duplicar: ${err?.message ?? "erro desconhecido"}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await deleteProductCascade(supabase, productId);
    },
    onSuccess: async () => {
      await loadProducts();
      await qc.invalidateQueries({ queryKey: ["products:list"] });
    },
    onError: (err: Error) => {
      let errorMessage = "Erro ao excluir produto";
      
      if (err?.message?.includes('pedido')) {
        errorMessage = err.message;
      } else if (err?.message?.includes('foreign key')) {
        errorMessage = "Este produto possui dados vinculados e não pode ser excluído.";
      } else if (err?.message) {
        errorMessage = `Falha ao excluir: ${err.message}`;
      }
      
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (user?.id) {
      loadProducts();
    }
  }, [user?.id, loadProducts]);

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
        deleteMutation.mutate(productId);
      },
    });
  }, [confirm, deleteMutation]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (statusFilter === "all" || product.status === statusFilter)
  );

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
