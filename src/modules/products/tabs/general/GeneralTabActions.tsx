/**
 * GeneralTabActions - Botões de ação (Excluir / Salvar)
 */

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  hasChanges: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export function GeneralTabActions({
  hasChanges,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
}: Props) {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-border">
      <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
        {isDeleting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Excluindo...
          </>
        ) : (
          "Excluir Produto"
        )}
      </Button>

      <Button
        onClick={onSave}
        disabled={isSaving || !hasChanges}
        className="bg-primary hover:bg-primary/90"
      >
        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isSaving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>
  );
}
