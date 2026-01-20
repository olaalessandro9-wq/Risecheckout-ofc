/**
 * ProductFooter - Barra fixa inferior com ações do produto
 * 
 * Layout inspirado no Cakto:
 * - Esquerda: Excluir Produto (destructive)
 * - Direita: Salvar Produto (primary)
 * - Fixo na viewport, considerando offset do sidebar
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - UI/UX
 */

import { useNavigate } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDelete";
import { useProductContext } from "../context/ProductContext";
import { useNavigation } from "@/modules/navigation/hooks";
import { useIsMobile } from "@/hooks/use-mobile";

export function ProductFooter() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isMobile = useIsMobile();
  const { 
    product, 
    saveAll, 
    saving, 
    hasUnsavedChanges, 
    deleteProduct 
  } = useProductContext();
  
  // Offset dinâmico: em mobile sidebar é overlay, em desktop considera largura
  const leftOffset = isMobile ? 0 : navigation.currentWidth;
  
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
    <div 
      className="fixed bottom-0 right-0 z-40 pointer-events-none pb-6 px-6"
      style={{ left: `${leftOffset}px`, transition: 'left 0.2s ease-in-out' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Excluir Produto - Esquerda */}
        <ConfirmDeleteDialog
          resourceType="Produto"
          resourceName={product?.name || ""}
          onConfirm={handleDelete}
        >
          <Button 
            variant="destructive" 
            className="gap-2 shadow-lg"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Produto
          </Button>
        </ConfirmDeleteDialog>
        
        {/* Salvar Produto - Direita */}
        <Button 
          onClick={saveAll}
          disabled={saving || !hasUnsavedChanges}
          className="bg-primary hover:bg-primary/90 shadow-lg"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>
    </div>
  );
}
