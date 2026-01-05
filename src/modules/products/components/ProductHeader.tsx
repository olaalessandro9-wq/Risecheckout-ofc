/**
 * ProductHeader - Cabeçalho da página de edição de produto
 * 
 * A proteção contra navegação com alterações não salvas é feita pelo
 * UnsavedChangesGuard no ProductEdit.tsx (cobre qualquer navegação).
 */

import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductContext } from "../context/ProductContext";

export function ProductHeader() {
  const navigate = useNavigate();
  const { saveAll, saving, hasUnsavedChanges } = useProductContext();
  
  const handleBack = () => {
    navigate("/dashboard/produtos");
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
