/**
 * OrderBumpList - Order Bump Management Component
 * 
 * Lista gerenciável de Order Bumps com drag-and-drop.
 * 
 * @module components/products/order-bump-list
 * @version 2.1.0
 * @see RISE Protocol V3 - Modularization (300-line limit)
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createLogger } from "@/lib/logger";
import { SortableOrderBumpItem } from "./SortableOrderBumpItem";
import type { 
  OrderBump, 
  OrderBumpListProps, 
  RawOrderBumpRow, 
  OrderBumpsResponse,
  OrderBumpCrudResponse,
} from "./types";

const log = createLogger("OrderBumpList");

export function OrderBumpList({ 
  productId, 
  initialOrderBumps,
  onAdd, 
  onEdit, 
  maxOrderBumps = 5,
  onRefresh,
}: OrderBumpListProps) {
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>(initialOrderBumps || []);
  const [loading, setLoading] = useState(!initialOrderBumps);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadOrderBumps = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await api.call<OrderBumpsResponse>("admin-data", { 
        action: "order-bumps",
        productId,
      });

      if (error) throw error;

      const mappedBumps: OrderBump[] = (data?.orderBumps || []).map((bump: RawOrderBumpRow) => ({
        id: bump.id,
        parent_product_id: bump.parent_product_id || productId, // RISE V3
        checkout_id: bump.checkout_id,
        product_id: bump.product_id,
        offer_id: bump.offer_id,
        position: bump.position,
        active: bump.active,
        product_name: bump.products?.name || "Produto não encontrado",
        product_price: bump.products?.price || 0,
        product_image: bump.products?.image_url ?? undefined,
        offer_name: bump.offers?.name,
        offer_price: bump.offers?.price,
      }));

      setOrderBumps(mappedBumps);
    } catch (error: unknown) {
      log.error("Error loading order bumps:", error);
      toast.error("Erro ao carregar order bumps");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Só carrega se não tiver dados iniciais
  useEffect(() => {
    if (!initialOrderBumps) {
      loadOrderBumps();
    }
  }, [initialOrderBumps, loadOrderBumps]);

  // Atualiza quando dados iniciais mudam (refresh via contexto)
  useEffect(() => {
    if (initialOrderBumps) {
      setOrderBumps(initialOrderBumps);
      setLoading(false);
    }
  }, [initialOrderBumps]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = orderBumps.findIndex((b) => b.id === active.id);
    const newIndex = orderBumps.findIndex((b) => b.id === over.id);
    
    const newOrder = arrayMove(orderBumps, oldIndex, newIndex);
    setOrderBumps(newOrder);
    
    const checkoutId = newOrder[0]?.checkout_id;
    if (!checkoutId) {
      toast.error("Erro: checkout não encontrado");
      return;
    }
    
    setIsSaving(true);
    try {
      const orderedIds = newOrder.map(b => b.id);

      const { data: response, error } = await api.call<OrderBumpCrudResponse>("order-bump-crud", {
        action: "reorder",
        checkoutId,
        orderedIds,
      });

      if (error) throw new Error(error.message || "Erro ao reordenar");
      if (!response?.success) throw new Error(response?.error || "Erro ao reordenar");
      
      toast.success("Ordem atualizada com sucesso!");
      if (onRefresh) await onRefresh();
    } catch (error: unknown) {
      log.error("Erro ao atualizar ordem:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar nova ordem");
      if (onRefresh) {
        await onRefresh();
      } else {
        loadOrderBumps();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { data: response, error } = await api.call<OrderBumpCrudResponse>("order-bump-crud", {
        action: "delete",
        id,
      });

      if (error) throw new Error(error.message || "Erro ao remover");
      if (!response?.success) throw new Error(response?.error || "Erro ao remover");

      toast.success("Order bump removido com sucesso");
      if (onRefresh) {
        await onRefresh();
      } else {
        loadOrderBumps();
      }
    } catch (error: unknown) {
      log.error("Error removing order bump:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao remover order bump");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orderBumps.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderBumps.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {orderBumps.map((orderBump, index) => (
                <SortableOrderBumpItem
                  key={orderBump.id}
                  orderBump={orderBump}
                  index={index}
                  onEdit={onEdit}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {orderBumps.length === 0 && (
        <div className="bg-muted rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Nenhum order bump configurado ainda.
          </p>
          <p className="text-xs text-muted-foreground">
            Order bumps são produtos complementares oferecidos durante o checkout para aumentar o valor do pedido.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button 
          onClick={onAdd}
          disabled={orderBumps.length >= maxOrderBumps || isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? "Salvando..." : "Adicionar Order Bump"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {orderBumps.length}/{maxOrderBumps}
        </span>
      </div>
    </div>
  );
}
