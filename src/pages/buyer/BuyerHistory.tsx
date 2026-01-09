import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, ShoppingBag } from "lucide-react";
import { formatCentsToBRL } from "@/lib/money";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PAID: { label: "Pago", variant: "default" },
    PENDING: { label: "Pendente", variant: "secondary" },
    REFUNDED: { label: "Reembolsado", variant: "destructive" },
    CHARGEBACK: { label: "Chargeback", variant: "destructive" },
  };
  const config = statusMap[status] || { label: status, variant: "outline" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function BuyerHistory() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { orders, isLoading: dataLoading, fetchOrders } = useBuyerOrders();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Histórico de Compras</h1>
        <p className="text-muted-foreground">
          {orders.length} {orders.length === 1 ? "compra realizada" : "compras realizadas"}
        </p>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma compra encontrada</h3>
            <p className="text-muted-foreground">
              Quando você realizar uma compra, ela aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {order.product?.image_url ? (
                    <img
                      src={order.product.image_url}
                      alt={order.product_name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {order.product_name || order.product?.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="font-semibold text-lg">
                    {formatCentsToBRL(order.amount_cents)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
