/**
 * ProductHeader - Header Card do Produto
 * 
 * Responsabilidade única: Renderizar header com imagem, nome e info básica
 * 
 * @see RISE Protocol V3 - Single Responsibility Principle
 */

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "./utils";

interface ProductHeaderProps {
  name: string | null;
  imageUrl: string | null;
  producerName: string | null;
  maxCommission: number;
  isOwner: boolean;
}

export function ProductHeader({
  name,
  imageUrl,
  producerName,
  maxCommission,
  isOwner,
}: ProductHeaderProps) {
  return (
    <div className="rounded-xl border bg-card p-4 mb-6">
      <div className="flex items-start gap-4">
        {imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={name || "Produto"}
              className="w-16 h-16 rounded-lg object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <h2 className="font-semibold text-base text-foreground leading-tight">
            {name}
          </h2>
          {isOwner ? (
            <Badge variant="secondary" className="text-xs">
              Você é o produtor
            </Badge>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Por <span className="font-medium">{producerName || "Produtor"}</span>
              </p>

              {maxCommission > 0 && (
                <p className="text-sm text-muted-foreground">
                  Você pode lucrar até{" "}
                  <span className="font-bold text-foreground">
                    {formatPrice(maxCommission)}
                  </span>{" "}
                  por venda
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
