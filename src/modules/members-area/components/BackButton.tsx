/**
 * BackButton - Botão de voltar para navegação
 */

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = "Voltar ao Produto" }: BackButtonProps) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
