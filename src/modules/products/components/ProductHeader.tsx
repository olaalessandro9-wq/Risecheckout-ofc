/**
 * ProductHeader - Cabeçalho com modal customizado para alterações não salvas
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDiscardModal } from "@/components/modals/ConfirmDiscardModal";
import { useProductContext } from "../context/ProductContext";

export function ProductHeader() {
  const navigate = useNavigate();
  const { saveAll, saving, hasUnsavedChanges } = useProductContext();
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
      return;
    }
    navigate("/dashboard/produtos");
  };

  const handleDiscardConfirm = () => {
    navigate("/dashboard/produtos");
  };

  const handleDiscardCancel = () => {
    // Modal fecha automaticamente via onClose
  };
  
  return (
    <>
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

      <ConfirmDiscardModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={handleDiscardConfirm}
        onCancel={handleDiscardCancel}
        text="Caso você volte perderá as suas alterações."
      />
    </>
  );
}
