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
    if (!productId) {
      toast.error("Produto não encontrado");
      return;
    }
    
    // Opens preview in new tab with preview mode flag
    const previewUrl = `/minha-conta/produto/${productId}?preview=true`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenStudentArea = () => {
    if (!productId) {
      toast.error("Produto não encontrado");
      return;
    }
    
    // Opens buyer dashboard for this product
    const studentUrl = `/minha-conta/produto/${productId}`;
    window.open(studentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePreview}
        className="gap-2"
        disabled={!productId}
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">Pré-Visualizar</span>
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        onClick={handleOpenStudentArea}
        className="gap-2"
        disabled={!productId}
      >
        <ExternalLink className="h-4 w-4" />
        <span className="hidden sm:inline">Área do Aluno</span>
      </Button>
    </div>
  );
}
