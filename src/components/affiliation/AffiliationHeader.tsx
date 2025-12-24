import { ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AffiliationDetails } from "@/hooks/useAffiliationDetails";

interface AffiliationHeaderProps {
  affiliation: AffiliationDetails;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function AffiliationHeader({ affiliation }: AffiliationHeaderProps) {
  const navigate = useNavigate();
  const product = affiliation.product;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2"
          onClick={() => navigate("/dashboard/minhas-afiliacoes")}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <span>/</span>
        <span>Minhas Afiliações</span>
        <span>/</span>
        <span className="text-foreground font-medium">{product?.name || "Produto"}</span>
      </div>

      {/* Header Card */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start gap-6">
          {/* Imagem do Produto */}
          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {product?.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          {/* Info do Produto */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold truncate">{product?.name || "Produto"}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {product?.marketplace_category || "Produto Digital"}
                  </Badge>
                  <Badge 
                    variant={affiliation.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {affiliation.status === 'active' ? 'Afiliação Ativa' : 
                     affiliation.status === 'pending' ? 'Pendente' : 
                     affiliation.status === 'rejected' ? 'Recusada' : affiliation.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(affiliation.total_sales_amount / 100)}
              </p>
              <p className="text-sm text-muted-foreground">faturado</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{affiliation.total_sales_count}</p>
              <p className="text-sm text-muted-foreground">vendas</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{affiliation.commission_rate}%</p>
              <p className="text-sm text-muted-foreground">comissão</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
