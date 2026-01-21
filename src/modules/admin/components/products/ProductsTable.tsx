/**
 * ProductsTable - Tabela de Produtos Admin
 * 
 * Componente puro que exibe a tabela de produtos com ações.
 * 
 * @version 1.0.0
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, CheckCircle, Ban, Trash2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  type ProductWithMetrics,
  type ProductSortField,
  type SortDirection,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLORS,
  formatCentsToBRL,
} from "@/modules/admin/types/admin.types";

interface ProductsTableProps {
  products: ProductWithMetrics[];
  isLoading: boolean;
  sortField: ProductSortField;
  sortDirection: SortDirection;
  onSort: (field: ProductSortField) => void;
  onViewDetails: (productId: string) => void;
  onActivate: (productId: string, productName: string) => void;
  onBlock: (productId: string, productName: string) => void;
  onDelete: (productId: string, productName: string) => void;
}

export function ProductsTable({
  products,
  isLoading,
  sortField,
  sortDirection,
  onSort,
  onViewDetails,
  onActivate,
  onBlock,
  onDelete,
}: ProductsTableProps) {
  const SortButton = ({ field, children }: { field: ProductSortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortField === field ? "opacity-100" : "opacity-50"}`} />
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum produto encontrado com os filtros selecionados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortButton field="name">Nome</SortButton>
          </TableHead>
          <TableHead>Vendedor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <SortButton field="price">Preço</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="gmv">GMV</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="orders">Vendas</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="date">Criado em</SortButton>
          </TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium max-w-[200px] truncate">
              {product.name}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {product.vendor_name || "-"}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={PRODUCT_STATUS_COLORS[product.status || "active"]}
              >
                {PRODUCT_STATUS_LABELS[product.status || "active"] || product.status}
              </Badge>
            </TableCell>
            <TableCell>{formatCentsToBRL(product.price)}</TableCell>
            <TableCell className="font-medium">{formatCentsToBRL(product.total_gmv)}</TableCell>
            <TableCell>{product.orders_count}</TableCell>
            <TableCell>
              {product.created_at
                ? format(new Date(product.created_at), "dd/MM/yyyy", { locale: ptBR })
                : "-"}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewDetails(product.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  {product.status !== "active" && (
                    <DropdownMenuItem onClick={() => onActivate(product.id, product.name)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ativar
                    </DropdownMenuItem>
                  )}
                  {product.status !== "blocked" && (
                    <DropdownMenuItem onClick={() => onBlock(product.id, product.name)}>
                      <Ban className="h-4 w-4 mr-2" />
                      Bloquear
                    </DropdownMenuItem>
                  )}
                  {product.status !== "deleted" && (
                    <DropdownMenuItem
                      onClick={() => onDelete(product.id, product.name)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
