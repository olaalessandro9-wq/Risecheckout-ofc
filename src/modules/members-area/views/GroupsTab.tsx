/**
 * GroupsTab - Placeholder para gestão de grupos de acesso
 */

import { FolderKanban } from "lucide-react";

interface GroupsTabProps {
  productId?: string;
}

export function GroupsTab({ productId }: GroupsTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FolderKanban className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Em Desenvolvimento</h2>
      <p className="text-muted-foreground max-w-md">
        Gerencie grupos de acesso para segmentar seus alunos e controlar 
        quais módulos cada grupo pode acessar.
      </p>
    </div>
  );
}
