/**
 * UserProductsSection - Seção de produtos do usuário
 * 
 * RISE Protocol V3 - Componente puro
 * 
 * @version 1.0.0
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, CheckCircle, XCircle, Trash2 } from "lucide-react";
import type { UserProduct } from "../../types/admin.types";
import { PRODUCT_STATUS_COLORS } from "../../types/admin.types";
import { formatCentsToBRL } from "@/lib/money";

interface UserProductsSectionProps {
  products: UserProduct[];
  isLoading: boolean;
  isOwner: boolean;
  onProductAction: (productId: string, productName: string, action: "activate" | "block" | "delete") => void;
}

export function UserProductsSection({
  products,
  isLoading,
  isOwner,
  onProductAction,
}: UserProductsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Package className="h-4 w-4" />
        Produtos ({products.length})
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : products.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>GMV</TableHead>
                {isOwner && <TableHead className="w-[80px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={PRODUCT_STATUS_COLORS[product.status || "active"]}
                    >
                      {product.status === "active"
                        ? "Ativo"
                        : product.status === "blocked"
                        ? "Bloqueado"
                        : "Removido"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        product.total_gmv > 0
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }
                    >
                      {formatCentsToBRL(product.total_gmv)}
                    </span>
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <div className="flex gap-1">
                        {product.status !== "active" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-500"
                            onClick={() =>
                              onProductAction(product.id, product.name, "activate")
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {product.status !== "blocked" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500"
                            onClick={() =>
                              onProductAction(product.id, product.name, "block")
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {product.status !== "deleted" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              onProductAction(product.id, product.name, "delete")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
      )}
    </div>
  );
}
