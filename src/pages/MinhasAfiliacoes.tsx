/**
 * MinhasAfiliacoes - Página de afiliações do usuário
 * 
 * Exibe tabela no padrão Cakto: Data | Produto | Comissão | Status | Ações
 */

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAffiliations } from "@/hooks/useAffiliations";
import { AffiliationsTable } from "@/components/affiliations/AffiliationsTable";

export default function MinhasAfiliacoes() {
  const { affiliations, isLoading, cancelAffiliation } = useAffiliations();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Afiliações</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos que você promove.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Afiliados</CardTitle>
        </CardHeader>
        <CardContent>
          <AffiliationsTable
            affiliations={affiliations}
            onCancelAffiliation={cancelAffiliation}
          />
        </CardContent>
      </Card>
    </div>
  );
}
