/**
 * ProductFooter - Barra fixa inferior com ações do produto
 * 
 * Layout inspirado no Cakto:
 * - Esquerda: Excluir Produto (destructive)
 * - Direita: Salvar Produto (primary)
 * - Fixo na viewport, considerando offset do sidebar
 * 
 * Refatorado para usar o componente reutilizável <StickyActionBar>
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI/UX
 * @see /src/components/ui/sticky-action-bar.tsx
 */

import { useNavigate } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDelete";
import { useProductContext } from "../context/ProductContext";

export function ProductFooter() {
  const navigate = useNavigate();
  const { 
    product, 
    saveAll, 
    saving, 
    hasUnsavedChanges, 
    deleteProduct 
  } = useProductContext();
  
  const handleDelete = async () => {
    const success = await deleteProduct();
    if (success) {
      navigate("/dashboard/produtos");
    }
    if (!success) {
      throw new Error("Falha ao excluir produto");
    }
  };
  
  return (
    <StickyActionBar
      leftAction={
        <ConfirmDeleteDialog
          resourceType="Produto"
          resourceName={product?.name || ""}
          onConfirm={handleDelete}
        >
          <Button 
            variant="destructive" 
            className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Produto
          </Button>
        </ConfirmDeleteDialog>
      }
      rightAction={
        <Button 
          onClick={saveAll}
          disabled={saving || !hasUnsavedChanges}
          className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-shadow"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? "Salvando..." : "Salvar Produto"}
        </Button>
      }
    />
  );
}
