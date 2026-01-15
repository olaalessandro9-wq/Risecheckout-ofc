/**
 * OrderBumpTab - Aba de Order Bumps do Produto
 * 
 * Esta aba gerencia order bumps (produtos complementares) que aparecem
 * após a compra principal no checkout.
 * 
 * Componentes:
 * - OrderBumpList: Lista de order bumps com drag & drop
 * - OrderBumpDialog: Modal para adicionar/editar order bumps
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { OrderBumpList } from "@/components/products/OrderBumpList";
import { OrderBumpDialog } from "@/components/products/order-bump-dialog";
import { useProductContext } from "../context/ProductContext";
import { supabase } from "@/integrations/supabase/client";
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

  const handleEditOrderBump = async (orderBump: EditOrderBump) => {
    // Buscar dados atualizados do banco para garantir que custom_title e custom_description estejam corretos
    try {
      const { data, error } = await supabase
        .from('order_bumps')
        .select('*')
        .eq('id', orderBump.id)
        .single();
      
      if (error) throw error;
      setEditingOrderBump((data as EditOrderBump) || orderBump);  // Usar dados do banco ou fallback para o objeto original
    } catch (error: unknown) {
      console.error('Erro ao buscar order bump:', error);
      setEditingOrderBump(orderBump);  // Fallback para o objeto original em caso de erro
    }
    setOrderBumpDialogOpen(true);
  };

  const handleOrderBumpSuccess = () => {
    // Refresh order bumps list
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
          if (!open) setEditingOrderBump(null); // Limpar ao fechar
        }}
        productId={product.id}
        onSuccess={handleOrderBumpSuccess}
        editOrderBump={editingOrderBump}
      />
    </>
  );
}
