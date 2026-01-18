/**
 * ProductCard - Card de Produto (Estilo Hotmart)
 * 
 * Layout responsivo inspirado no Hotmart Marketplace
 */

import { Card } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

interface ProductCardProps {
  product: MarketplaceProduct;
  onViewDetails: (productId: string) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  // Formatar preço
  const formatPrice = (price: number | null) => {
    if (!price) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price / 100);
  };

  // Calcular comissão máxima
  const maxCommission = ((product.price || 0) * (product.commission_percentage || 0)) / 100;

  return (
    <Card 
      className="group overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-card"
      onClick={() => onViewDetails(product.id!)}
    >
      {/* Imagem do Produto - Aspect Ratio 4:3 */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name || "Produto"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-5xl">📦</span>
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="p-4 space-y-3">
        {/* Nome do Produto */}
        <h3 className="font-medium text-base leading-tight line-clamp-2 min-h-[2.5rem] text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Comissão de até */}
        <div className="space-y-0.5">
          <span className="text-xs text-muted-foreground">Comissão de até</span>
          <p className="text-2xl font-bold text-emerald-500">
            {formatPrice(maxCommission)}
          </p>
        </div>

        {/* Preço máximo do produto */}
        <p className="text-xs text-muted-foreground">
          Preço máximo do produto: <span className="font-medium text-foreground">{formatPrice(product.price)}</span>
        </p>
      </div>
    </Card>
  );
}
