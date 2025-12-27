/**
 * MinhasAfiliacoesContent - Conteúdo da aba Minhas Afiliações
 * 
 * Reutiliza componentes unificados: useAffiliations + AffiliationsTable
 */

import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAffiliations } from "@/hooks/useAffiliations";
import { AffiliationsTable } from "@/components/affiliations/AffiliationsTable";

export function MinhasAfiliacoesContent() {
  const { affiliations, isLoading, cancelAffiliation } = useAffiliations();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
