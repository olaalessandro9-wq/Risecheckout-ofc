/**
 * OrderBumpTab - Aba de Order Bumps do Produto
 * 
 * OTIMIZADO: Usa dados do cache React Query via ProductContext
 * Não faz fetch próprio - dados já vêm do product-full-loader (BFF)
 * 
 * @see RISE Protocol V3 - Cache Hit Pattern
 */

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { createLogger } from "@/lib/logger";

const log = createLogger("OrderBumpTab");
import { OrderBumpList } from "@/components/products/OrderBumpList";
import { OrderBumpDialog } from "@/components/products/order-bump-dialog";
import { useProductContext } from "../context/ProductContext";
import { api } from "@/lib/api";
import type { EditOrderBump } from "@/components/products/order-bump-dialog/types";

interface OrderBumpDetailResponse {
  orderBump?: EditOrderBump;
}

/**
 * Mapeia OrderBump do contexto para formato do OrderBumpList
 */
interface OrderBumpListItem {
  id: string;
  checkout_id: string;
  product_id: string;
  offer_id: string | null;
  position: number;
  active: boolean;
  product_name: string;
  product_price: number;
  product_image?: string;
  offer_name?: string;
  offer_price?: number;
}

export function OrderBumpTab() {
  const { product, orderBumps, refreshOrderBumps, loading } = useProductContext();
  const [orderBumpDialogOpen, setOrderBumpDialogOpen] = useState(false);
  const [editingOrderBump, setEditingOrderBump] = useState<EditOrderBump | null>(null);

  /**
   * Transforma orderBumps do contexto para o formato esperado pelo OrderBumpList
   * Memoizado para evitar re-renders desnecessários
   */
  const mappedOrderBumps: OrderBumpListItem[] = useMemo(() => {
    return orderBumps.map((ob, index) => ({
      id: ob.id,
      checkout_id: "", // Será preenchido pela lista se necessário
      product_id: ob.bump_product_id || "",
      offer_id: null,
      position: index,
      active: true,
      product_name: ob.name,
      product_price: ob.price,
      product_image: ob.image_url || undefined,
    }));
  }, [orderBumps]);

  const handleAddOrderBump = useCallback(() => {
    setEditingOrderBump(null);
    setOrderBumpDialogOpen(true);
  }, []);

  /**
   * Handle edit order bump via Edge Function
   */
  const handleEditOrderBump = useCallback(async (orderBump: EditOrderBump) => {
    try {
      const { data, error } = await api.call<OrderBumpDetailResponse>("admin-data", {
        action: "order-bump-detail",
        orderBumpId: orderBump.id,
      });
      
      if (error) throw new Error(error.message);
      setEditingOrderBump(data?.orderBump || orderBump);
    } catch (error: unknown) {
      log.error('Erro ao buscar order bump:', error);
      setEditingOrderBump(orderBump);
    }
    setOrderBumpDialogOpen(true);
  }, []);

  const handleOrderBumpSuccess = useCallback(async () => {
    setEditingOrderBump(null);
    // Atualiza via cache React Query
    await refreshOrderBumps();
  }, [refreshOrderBumps]);

  const handleRefresh = useCallback(async () => {
    await refreshOrderBumps();
  }, [refreshOrderBumps]);

  if (!product?.id) {
    return (
      <div className="bg-card border border-border rounded-lg p-8">
        <p className="text-muted-foreground">Carregando order bumps...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-8 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Order Bump</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Adicione produtos complementares que aparecem após a compra principal
            </p>
          </div>
          <Button onClick={handleAddOrderBump} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Adicionar Order Bump
          </Button>
        </div>
        
        <OrderBumpList 
          productId={product.id}
          initialOrderBumps={loading ? undefined : mappedOrderBumps}
          onAdd={handleAddOrderBump}
          onEdit={handleEditOrderBump}
          onRefresh={handleRefresh}
        />
      </div>

      <OrderBumpDialog
        open={orderBumpDialogOpen}
        onOpenChange={(open) => {
          setOrderBumpDialogOpen(open);
          if (!open) setEditingOrderBump(null);
        }}
        productId={product.id}
        onSuccess={handleOrderBumpSuccess}
        editOrderBump={editingOrderBump}
      />
    </>
  );
}
