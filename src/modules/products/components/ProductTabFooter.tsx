/**
 * ProductTabFooter - Barra de Ações no Final de Cada Aba
 * 
 * Este componente renderiza os botões de ação (Excluir/Salvar Produto)
 * no final de cada aba de edição de produto.
 * 
 * Características:
 * - Posicionamento relativo (não fixo)
 * - Aparece naturalmente no final do conteúdo
 * - Responsivo (mobile: botões empilhados, desktop: lado a lado)
 * - Visual limpo com borda superior
 * 
 * Seguindo RISE ARCHITECT PROTOCOL V3 e padrão Cakto
 */

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useProductContext } from "../context/ProductContext";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";

export function ProductTabFooter() {
  const { 
    product,
    saveAll, 
    saving, 
    hasUnsavedChanges,
    deleteProduct,
    deleting
  } = useProductContext();
  
  const { confirm, Bridge: ConfirmDeleteBridge } = useConfirmDelete();

  // Handler de exclusão com confirmação
  const handleDelete = async () => {
    if (!product) return;
    
    const confirmed = await confirm({
      title: "Excluir Produto",
      description: `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      await deleteProduct();
    }
  };

  return (
    <>
      <ConfirmDeleteBridge />
      
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Botão Excluir à esquerda */}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !product}
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Excluindo..." : "Excluir Produto"}
          </Button>

          {/* Botão Salvar à direita */}
          <Button
            onClick={saveAll}
            disabled={saving || !hasUnsavedChanges}
            className="w-full sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar Produto"}
          </Button>
        </div>
      </div>
    </>
  );
}
