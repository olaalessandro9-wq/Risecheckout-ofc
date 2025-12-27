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

// Mapeamento de status para labels e variantes
const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Aprovada", variant: "default" },
  pending: { label: "Em análise", variant: "secondary" },
  rejected: { label: "Recusada", variant: "destructive" },
  blocked: { label: "Bloqueada", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export function AffiliationHeader({ affiliation }: AffiliationHeaderProps) {
  const navigate = useNavigate();
  const product = affiliation.product;
  
  // Obter configuração do status ou fallback
  const statusConfig = STATUS_CONFIG[affiliation.status] || { 
    label: affiliation.status, 
    variant: "outline" as const 
  };

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
                  <span className="text-sm text-muted-foreground">Status da afiliação:</span>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
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