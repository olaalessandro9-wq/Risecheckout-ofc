/**
 * MembersAreaActions - Botões de ação da área de membros
 */

import { ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MembersAreaActionsProps {
  productId?: string;
}

export function MembersAreaActions({ productId }: MembersAreaActionsProps) {
  const handlePreview = () => {
    // TODO: Implementar preview do curso
    toast.info("Funcionalidade de pré-visualização em desenvolvimento");
  };

  const handleOpenStudentArea = () => {
    // TODO: Abrir área do aluno em nova aba
    toast.info("Área do aluno em desenvolvimento");
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePreview}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">Pré-Visualizar</span>
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        onClick={handleOpenStudentArea}
        className="gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        <span className="hidden sm:inline">Área do Aluno</span>
      </Button>
    </div>
  );
}
