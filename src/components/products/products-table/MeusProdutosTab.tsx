/**
 * MeusProdutosTab - "Meus Produtos" tab content
 */

import { Button } from "@/components/ui/button";
import { ProductRow } from "./ProductRow";
import type { Product } from "./types";

interface MeusProdutosTabProps {
  products: Product[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  duplicateIsPending: boolean;
  deleteIsPending: boolean;
}

export function MeusProdutosTab({
  products,
  onEdit,
  onDuplicate,
  onDelete,
  duplicateIsPending,
  deleteIsPending,
}: MeusProdutosTabProps) {
  return (
    <>
      {/* Tabela de produtos */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Preço</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  duplicateIsPending={duplicateIsPending}
                  deleteIsPending={deleteIsPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {products.length > 0 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              {"<"}
            </Button>
            <Button size="icon" className="w-8 h-8 bg-primary">
              1
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              {">"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
