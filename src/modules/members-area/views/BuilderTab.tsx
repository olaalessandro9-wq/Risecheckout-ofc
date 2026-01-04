/**
 * BuilderTab - Placeholder para personalização visual da área do aluno
 */

import { Paintbrush } from "lucide-react";

interface BuilderTabProps {
  productId?: string;
}

export function BuilderTab({ productId }: BuilderTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Paintbrush className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Em Desenvolvimento</h2>
      <p className="text-muted-foreground max-w-md">
        Personalize o visual da área do aluno com cores, fontes, 
        layout e elementos visuais customizados.
      </p>
    </div>
  );
}
