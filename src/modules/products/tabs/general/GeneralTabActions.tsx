/**
 * GeneralTabActions - Botão de Exclusão
 * 
 * REFATORADO: Botão "Salvar Alterações" REMOVIDO
 * Motivo: Salvamento unificado via botão global "Salvar Produto" no header
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Zero Duplicação
 */

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isDeleting: boolean;
  onDelete: () => void;
}

export function GeneralTabActions({
  isDeleting,
  onDelete,
}: Props) {
  return (
    <div className="flex justify-start items-center pt-6 border-t border-border">
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
    </div>
  );
}
