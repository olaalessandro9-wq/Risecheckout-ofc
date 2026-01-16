/**
 * OrderBumpTab - Aba de Order Bumps do Produto
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { OrderBumpList } from "@/components/products/OrderBumpList";
import { OrderBumpDialog } from "@/components/products/order-bump-dialog";
import { useProductContext } from "../context/ProductContext";
import { supabase } from "@/integrations/supabase/client";
import { getProducerSessionToken } from "@/hooks/useProducerAuth";
import type { EditOrderBump } from "@/components/products/order-bump-dialog/types";

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
      const sessionToken = getProducerSessionToken();
      
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: {
          action: "order-bump-detail",
          orderBumpId: orderBump.id,
        },
        headers: { "x-producer-session-token": sessionToken || "" },
      });
      
      if (error) throw error;
      setEditingOrderBump((data?.orderBump as EditOrderBump) || orderBump);
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
