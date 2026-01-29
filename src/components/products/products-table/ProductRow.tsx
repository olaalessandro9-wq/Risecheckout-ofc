/**
 * ProductRow - Individual product row with actions dropdown
 * 
 * RISE V3 10.0/10 - Prefetch on Hover
 * 
 * Implementa prefetch do chunk ProductEdit no hover para
 * navegação instantânea ao clicar em um produto.
 */

import { MoreVertical } from "lucide-react";
import { formatCentsToBRL as formatBRL } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "./types";

// ============================================================================
// PREFETCH - Chunk JS do ProductEdit (RISE V3 Pattern)
// ============================================================================

/**
 * Flag module-level para evitar múltiplos imports.
 * Uma vez que o chunk está em cache, o prefetch é desnecessário.
 */
let prefetched = false;

/**
 * Prefetch do chunk ProductEdit no hover.
 * Segue o padrão estabelecido em SidebarItem.tsx.
 */
const prefetchProductEdit = () => {
  if (prefetched) return;
  prefetched = true;
  import("@/pages/ProductEdit");
};

// ============================================================================
// TYPES
// ============================================================================

interface ProductRowProps {
  product: Product;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  duplicateIsPending: boolean;
  deleteIsPending: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductRow({
  product,
  onEdit,
  onDuplicate,
  onDelete,
  duplicateIsPending,
  deleteIsPending,
}: ProductRowProps) {
  return (
    <tr 
      className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
      onClick={() => onEdit(product.id)}
      onMouseEnter={prefetchProductEdit}
    >
      <td className="p-4 text-foreground">{product.name}</td>
      <td className="p-4 text-foreground">
        {formatBRL(product.offers?.[0]?.price || product.price)}
      </td>
      <td className="p-4">
        <Badge 
          variant={product.status === "active" ? "default" : "secondary"}
          className={product.status === "active" ? "bg-success/20 text-success hover:bg-success/30" : ""}
        >
          {product.status === "active" ? "Ativo" : "Bloqueado"}
        </Badge>
      </td>
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onEdit(product.id)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDuplicate(product.id)}
              disabled={duplicateIsPending || deleteIsPending}
            >
              {duplicateIsPending ? "Duplicando..." : "Duplicar"}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(product.id, product.name)}
              disabled={duplicateIsPending || deleteIsPending}
            >
              {deleteIsPending ? "Excluindo..." : "Excluir"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
