/**
 * OrderBumpTab - Aba de Order Bumps do Produto
 * 
 * MIGRATED: Uses api.call() instead of supabase.functions.invoke()
 * @see RISE Protocol V2 - Zero database access from frontend
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { OrderBumpList } from "@/components/products/OrderBumpList";
import { OrderBumpDialog } from "@/components/products/order-bump-dialog";
import { useProductContext } from "../context/ProductContext";
import { api } from "@/lib/api";
import type { EditOrderBump } from "@/components/products/order-bump-dialog/types";

interface OrderBumpDetailResponse {
  orderBump?: EditOrderBump;
}

export function OrderBumpTab() {
  const { product } = useProductContext();
  const [orderBumpDialogOpen, setOrderBumpDialogOpen] = useState(false);
  const [editingOrderBump, setEditingOrderBump] = useState<EditOrderBump | null>(null);
  const [orderBumpKey, setOrderBumpKey] = useState(0);

  const handleAddOrderBump = () => {
    setEditingOrderBump(null);
    setOrderBumpDialogOpen(true);
  };

  /**
   * Handle edit order bump via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const handleEditOrderBump = async (orderBump: EditOrderBump) => {
    try {
      const { data, error } = await api.call<OrderBumpDetailResponse>("admin-data", {
        action: "order-bump-detail",
        orderBumpId: orderBump.id,
      });
      
      if (error) throw new Error(error.message);
      setEditingOrderBump(data?.orderBump || orderBump);
    } catch (error: unknown) {
      console.error('Erro ao buscar order bump:', error);
      setEditingOrderBump(orderBump);
    }
    setOrderBumpDialogOpen(true);
  };

  const handleOrderBumpSuccess = () => {
    setOrderBumpKey(prev => prev + 1);
    setEditingOrderBump(null);
  };

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
          key={orderBumpKey}
          productId={product.id}
          onAdd={handleAddOrderBump}
          onEdit={handleEditOrderBump}
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
