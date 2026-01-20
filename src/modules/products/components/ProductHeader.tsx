/**
 * ProductHeader - Cabeçalho da página de edição de produto
 * 
 * Usa NavigationGuardProvider para exibir modal de alterações não salvas.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Navigation Guard System
 */

import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductContext } from "../context/ProductContext";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";

export function ProductHeader() {
  const { attemptNavigation } = useNavigationGuard();
  const { saveAll, saving, hasUnsavedChanges } = useProductContext();
  
  const handleBack = () => {
    // Usa attemptNavigation para verificar dirty state e exibir modal
    attemptNavigation("/dashboard/produtos");
  };
  
  return (
    <div className="flex items-center justify-between">
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Button>
      <Button 
        onClick={saveAll}
        disabled={saving || !hasUnsavedChanges}
        className="bg-primary hover:bg-primary/90"
      >
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {saving ? "Salvando..." : "Salvar Produto"}
      </Button>
    </div>
  );
}
