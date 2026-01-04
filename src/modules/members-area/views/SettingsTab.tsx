/**
 * SettingsTab - Placeholder para configurações da área de membros
 */

import { Settings } from "lucide-react";

interface SettingsTabProps {
  productId?: string;
}

export function SettingsTab({ productId }: SettingsTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Settings className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Em Desenvolvimento</h2>
      <p className="text-muted-foreground max-w-md">
        Configure opções gerais da área de membros, como acesso, 
        notificações e integrações.
      </p>
    </div>
  );
}
