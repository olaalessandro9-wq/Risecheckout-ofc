/**
 * EmptyState - Estado Vazio
 * 
 * Exibido quando não há produtos no marketplace ou quando a busca não retorna resultados
 */

import { Card, CardContent } from "@/components/ui/card";
import { Store, Search, Filter } from "lucide-react";

interface EmptyStateProps {
  type?: "no-products" | "no-results" | "no-category";
  message?: string;
}

export function EmptyState({ type = "no-products", message }: EmptyStateProps) {
  const configs = {
    "no-products": {
      icon: Store,
      title: "Nenhum produto disponível",
      description: message || "Ainda não há produtos no marketplace. Volte mais tarde!",
    },
    "no-results": {
      icon: Search,
      title: "Nenhum resultado encontrado",
      description: message || "Tente ajustar os filtros ou buscar por outros termos.",
    },
    "no-category": {
      icon: Filter,
      title: "Nenhum produto nesta categoria",
      description: message || "Selecione outra categoria ou remova os filtros.",
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {config.description}
        </p>
      </CardContent>
    </Card>
  );
}
