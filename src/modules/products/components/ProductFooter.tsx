/**
 * ProductFooter - Barra fixa inferior com ações do produto
 * 
 * Layout inspirado no Cakto:
 * - Esquerda: Excluir Produto (destructive)
 * - Direita: Salvar Produto (primary)
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI/UX
 */

import { useNavigate } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    // ConfirmDeleteDialog espera que lance erro em caso de falha
    if (!success) {
      throw new Error("Falha ao excluir produto");
    }
  };
  
  return (
    <div className="sticky bottom-0 z-40 bg-card border-t border-border py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Excluir Produto - Esquerda */}
        <ConfirmDeleteDialog
          resourceType="Produto"
          resourceName={product?.name || ""}
          onConfirm={handleDelete}
        >
          <Button 
            variant="destructive" 
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Produto
          </Button>
        </ConfirmDeleteDialog>
        
        {/* Salvar Produto - Direita */}
        <Button 
          onClick={saveAll}
          disabled={saving || !hasUnsavedChanges}
          className="bg-primary hover:bg-primary/90"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>
    </div>
  );
}
