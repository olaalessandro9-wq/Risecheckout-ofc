/**
 * AdminProductsTab - Aba global de produtos da plataforma
 * 
 * MIGRATED: Uses Edge Function instead of supabase.from()
 * 
 * Permite visualizar, filtrar e moderar todos os produtos
 * Ações: ativar, bloquear, remover (soft delete)
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Search, Package, ArrowUpDown, MoreHorizontal, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { ProductDetailSheet } from "./ProductDetailSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductWithMetrics {
  id: string;
  name: string;
  price: number;
  status: string | null;
  created_at: string | null;
  user_id: string | null;
  vendor_name: string | null;
  total_gmv: number;
  orders_count: number;
}

type SortField = "name" | "gmv" | "orders" | "price" | "date";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "blocked" | "deleted";

const formatCentsToBRL = (cents: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  blocked: "Bloqueado",
  deleted: "Removido",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  blocked: "bg-red-500/10 text-red-500 border-red-500/20",
  deleted: "bg-muted text-muted-foreground border-muted",
};

export function AdminProductsTab() {
  const { role: callerRole } = usePermissions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("gmv");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    productId: string;
    productName: string;
    action: "activate" | "block" | "delete";
  } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const isOwner = callerRole === "owner";

  /**
   * Fetch products with metrics via Edge Function
   * MIGRATED: Uses supabase.functions.invoke instead of supabase.from()
   */
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products-global"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-data", {
        body: { action: "admin-products-global" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return (data.products || []) as ProductWithMetrics[];
    },
    enabled: isOwner,
  });

  // Mutation para alterar status do produto
  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-user-status", {
        body: { 
          action: "updateProductStatus",
          productId,
          status: newStatus,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-global"] });
      toast.success("Produto atualizado com sucesso!");
      setActionDialog(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar produto");
      setActionDialog(null);
    },
  });

  // Filtrar e ordenar produtos
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = products.filter((product) => {
      // Filtro de status
      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }

      // Filtro de busca
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.vendor_name?.toLowerCase().includes(searchLower) ||
          product.id.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "gmv":
          comparison = a.total_gmv - b.total_gmv;
          break;
        case "orders":
          comparison = a.orders_count - b.orders_count;
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "date":
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    return result;
  }, [products, search, statusFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleAction = (productId: string, productName: string, action: "activate" | "block" | "delete") => {
    setActionDialog({ open: true, productId, productName, action });
  };

  const confirmAction = () => {
    if (!actionDialog) return;
    
    const statusMap = {
      activate: "active",
      block: "blocked",
      delete: "deleted",
    };
    
    updateProductMutation.mutate({
      productId: actionDialog.productId,
      newStatus: statusMap[actionDialog.action],
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      activate: "ativar",
      block: "bloquear",
      delete: "remover",
    };
    return labels[action] || action;
  };

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Apenas owners podem gerenciar produtos globalmente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Produtos da Plataforma
        </CardTitle>
        <CardDescription>
          Visualize e gerencie todos os produtos cadastrados na plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, vendedor ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
              <SelectItem value="deleted">Removidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort("name")}
                  >
                    Produto
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort("price")}
                  >
                    Preço
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort("gmv")}
                  >
                    GMV
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort("orders")}
                  >
                    Pedidos
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => toggleSort("date")}
                  >
                    Criado em
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {product.id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{product.vendor_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[product.status || "active"]}>
                        {STATUS_LABELS[product.status || "active"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCentsToBRL(product.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={product.total_gmv > 0 ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                        {formatCentsToBRL(product.total_gmv)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={product.orders_count > 0 ? "font-medium" : "text-muted-foreground"}>
                        {product.orders_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.created_at 
                          ? format(new Date(product.created_at), "dd/MM/yyyy", { locale: ptBR })
                          : "-"
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedProductId(product.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          {product.status !== "active" && (
                            <DropdownMenuItem onClick={() => handleAction(product.id, product.name, "activate")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                          {product.status !== "blocked" && (
                            <DropdownMenuItem onClick={() => handleAction(product.id, product.name, "block")}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Bloquear
                            </DropdownMenuItem>
                          )}
                          {product.status !== "deleted" && (
                            <DropdownMenuItem 
                              onClick={() => handleAction(product.id, product.name, "delete")}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Contagem */}
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} produto(s) encontrado(s)
        </p>
      </CardContent>

      {/* Dialog de Confirmação */}
      <AlertDialog
        open={actionDialog?.open}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar ação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja {actionDialog && getActionLabel(actionDialog.action)} o produto{" "}
              <strong>{actionDialog?.productName}</strong>?
              {actionDialog?.action === "delete" && (
                <>
                  <br />
                  <span className="text-destructive">Esta ação não pode ser desfeita.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={actionDialog?.action === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet de Detalhes */}
      <ProductDetailSheet
        productId={selectedProductId}
        open={!!selectedProductId}
        onOpenChange={(open) => !open && setSelectedProductId(null)}
      />
    </Card>
  );
}
