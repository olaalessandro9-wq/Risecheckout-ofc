/**
 * OrderBumpList - Order Bump Management Component
 * 
 * @version 2.0.0 - RISE Protocol V3 - Zero console.log
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Gift, MoreVertical, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createLogger } from "@/lib/logger";

const log = createLogger("OrderBumpList");

interface OrderBump {
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

interface OrderBumpListProps {
  productId: string;
  onAdd: () => void;
  onEdit?: (orderBump: OrderBump) => void;
  maxOrderBumps?: number;
}

interface SortableOrderBumpItemProps {
  orderBump: OrderBump;
  index: number;
  onEdit?: (orderBump: OrderBump) => void;
  onRemove: (id: string) => void;
}

function SortableOrderBumpItem({ orderBump, index, onEdit, onRemove }: SortableOrderBumpItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: orderBump.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-lg p-4 flex items-start justify-between hover:border-primary/50 transition-colors ${
        isDragging ? 'z-50 shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
          </div>
          <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{index + 1}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground mb-1">
                {orderBump.product_name}
              </h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Preço: {orderBump.offer_price 
                    ? formatBRL(Number(orderBump.offer_price)) 
                    : formatBRL(Number(orderBump.product_price))}
                </span>
                {orderBump.offer_name && (
                  <>
                    <span>•</span>
                    <span className="text-primary">Oferta: {orderBump.offer_name}</span>
                  </>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(orderBump)}
                    className="cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onRemove(orderBump.id)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderBumpList({ productId, onAdd, onEdit, maxOrderBumps = 5 }: OrderBumpListProps) {
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  interface RawOrderBumpRow {
    id: string;
    checkout_id: string;
    product_id: string;
    offer_id: string | null;
    position: number;
    active: boolean;
    products?: {
      id: string;
      name: string;
      price: number;
      image_url?: string | null;
    } | null;
    offers?: {
      id: string;
      name: string;
      price: number;
    } | null;
  }

  interface OrderBumpsResponse {
    orderBumps?: RawOrderBumpRow[];
    error?: string;
  }

  interface OrderBumpCrudResponse {
    success: boolean;
    error?: string;
  }

  /**
   * Load order bumps via Edge Function
   * MIGRATED: Uses api.call() - Unified API Client
   */
  const loadOrderBumps = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await api.call<OrderBumpsResponse>("admin-data", { 
        action: "order-bumps",
        productId,
      });

      if (error) throw error;

      const mappedBumps: OrderBump[] = (data?.orderBumps || []).map((bump: RawOrderBumpRow) => {
        return {
          id: bump.id,
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
        };
      });

      setOrderBumps(mappedBumps);
    } catch (error: unknown) {
      log.error("Error loading order bumps:", error);
      toast.error("Erro ao carregar order bumps");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadOrderBumps();
  }, [loadOrderBumps]);

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
        action: 'reorder',
        checkoutId,
        orderedIds,
      });

      if (error) {
        throw new Error(error.message || "Erro ao reordenar");
      }

      if (!response?.success) {
        throw new Error(response?.error || "Erro ao reordenar");
      }
      
      toast.success('Ordem atualizada com sucesso!');
    } catch (error: unknown) {
      log.error("Erro ao atualizar ordem:", error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar nova ordem');
      loadOrderBumps();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {

      const { data: response, error } = await api.call<OrderBumpCrudResponse>("order-bump-crud", {
        action: 'delete',
        id,
      });

      if (error) {
        throw new Error(error.message || "Erro ao remover");
      }

      if (!response?.success) {
        throw new Error(response?.error || "Erro ao remover");
      }

      toast.success("Order bump removido com sucesso");
      loadOrderBumps();
    } catch (error: unknown) {
      log.error("Error removing order bump:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao remover order bump");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
