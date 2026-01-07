/**
 * BuilderTab - Gateway para o personalizador da área de membros
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Paintbrush, ExternalLink } from "lucide-react";

interface BuilderTabProps {
  productId?: string;
}

export function BuilderTab({ productId }: BuilderTabProps) {
  const navigate = useNavigate();

  const handleOpenBuilder = () => {
    if (productId) {
      navigate(`/dashboard/produtos/${productId}/members-area/builder`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Paintbrush className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Personalize sua Área de Membros</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Configure o visual da área do aluno com seções, banners, 
        layout e elementos visuais customizados.
      </p>
      <Button size="lg" onClick={handleOpenBuilder} disabled={!productId}>
        <Paintbrush className="h-4 w-4 mr-2" />
        Abrir Personalizador
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
