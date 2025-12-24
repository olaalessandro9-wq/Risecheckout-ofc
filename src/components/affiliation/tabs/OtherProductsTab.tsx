import { useNavigate } from "react-router-dom";
import { Package, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OtherProducerProduct } from "@/hooks/useAffiliationDetails";

interface OtherProductsTabProps {
  products: OtherProducerProduct[];
  producerName: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function OtherProductsTab({ products, producerName }: OtherProductsTabProps) {
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum outro produto</h3>
        <p className="text-muted-foreground">
          {producerName ? `${producerName} não tem` : "Este produtor não tem"} outros produtos no marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-2">
          Outros Produtos de {producerName || "Este Produtor"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Confira outros produtos deste produtor que você também pode promover
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
            >
              {/* Imagem */}
              <div className="aspect-video bg-muted flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="p-4">
                <h4 className="font-semibold truncate mb-2">{product.name}</h4>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold">
                    {formatCurrency(product.price / 100)}
                  </span>
                  {product.commission_percentage && (
                    <Badge variant="secondary" className="text-green-600">
                      Até {product.commission_percentage}%
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigate(`/dashboard/marketplace?product=${product.id}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver no Marketplace
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
