/**
 * ProductInfo - Informações do Produto
 * 
 * Responsabilidade única: Renderizar status, descrição, tipo e aprovação
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProductInfoProps {
  description: string | null;
  category: string | null;
  requiresManualApproval: boolean | null;
}

export function ProductInfo({
  description,
  category,
  requiresManualApproval,
}: ProductInfoProps) {
  return (
    <>
      {/* Status */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-foreground">Status</span>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700"
        >
          ● Ativo
        </Badge>
      </div>

      <Separator />

      {/* Descrição */}
      {description && (
        <>
          <div className="py-2">
            <h3 className="text-sm font-medium text-foreground mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          <Separator />
        </>
      )}

      {/* Tipo do Produto */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-foreground">Tipo do produto</span>
        <Badge variant="secondary">{category || "digital"}</Badge>
      </div>

      <Separator />

      {/* Aprovação */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-foreground">Aprovação</span>
        {requiresManualApproval ? (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-700"
          >
            ● Mediante análise
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700"
          >
            ● Imediata
          </Badge>
        )}
      </div>

      <Separator />
    </>
  );
}
