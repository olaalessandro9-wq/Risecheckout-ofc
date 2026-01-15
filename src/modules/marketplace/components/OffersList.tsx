/**
 * OffersList - Lista de Ofertas do Produto
 * 
 * Componente que lista todas as ofertas de um produto com preços e comissões
 * Inspirado em Cakto e Kirvano
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Offer {
  id: string;
  name: string;
  type: string;
  price: number;
  commission: number;
  checkoutUrl: string;
}

interface OffersListProps {
  offers: Offer[];
  productName: string;
}

export function OffersList({ offers, productName }: OffersListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copiar link para clipboard
  const handleCopyLink = async (offer: Offer) => {
    try {
      await navigator.clipboard.writeText(offer.checkoutUrl);
      setCopiedId(offer.id);
      toast.success("Link copiado!", {
        description: `Link da oferta "${offer.name}" copiado para a área de transferência`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error: unknown) {
      toast.error("Erro ao copiar link");
    }
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price / 100);
  };

  // Formatar tipo de oferta
  const formatOfferType = (type: string) => {
    const types: Record<string, string> = {
      one_time: "Pagamento Único",
      subscription: "Assinatura",
      upsell: "Upsell",
      downsell: "Downsell",
      order_bump: "Order Bump",
    };
    return types[type] || type;
  };

  // Badge de tipo
  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      one_time: "default",
      subscription: "secondary",
      upsell: "outline",
      downsell: "outline",
      order_bump: "outline",
    };
    return variants[type] || "default";
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma oferta disponível para este produto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Nome e Tipo */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm">{offer.name}</h4>
                <Badge variant={getTypeBadge(offer.type)} className="text-xs">
                  {formatOfferType(offer.type)}
                </Badge>
              </div>

              {/* Preço e Comissão */}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor da oferta: </span>
                  <span className="font-semibold">{formatPrice(offer.price)}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div>
                  <span className="text-muted-foreground">Você recebe até: </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatPrice(offer.commission)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyLink(offer)}
                className="gap-2"
              >
                {copiedId === offer.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(offer.checkoutUrl, "_blank")}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
