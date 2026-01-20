/**
 * SortableOrderBumpItem - Drag & Drop Order Bump Item
 * 
 * Componente individual de Order Bump com suporte a drag-and-drop.
 * 
 * @module components/products/order-bump-list
 * @version 1.0.0
 * @see RISE Protocol V3 - Modularization
 */

import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, MoreVertical, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SortableOrderBumpItemProps } from "./types";

export function SortableOrderBumpItem({ 
  orderBump, 
  index, 
  onEdit, 
  onRemove 
}: SortableOrderBumpItemProps) {
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
