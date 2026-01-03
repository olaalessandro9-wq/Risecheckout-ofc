import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  LogOut, 
  Package, 
  ShoppingBag, 
  Calendar,
  ArrowRight,
  Play,
  Lock
} from "lucide-react";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

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

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { buyer, isLoading: authLoading, isAuthenticated, logout } = useBuyerAuth();
  const { access, orders, isLoading: dataLoading, fetchAccess, fetchOrders } = useBuyerOrders();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAccess();
      fetchOrders();
    }
  }, [isAuthenticated, fetchAccess, fetchOrders]);

  const handleLogout = async () => {
    await logout();
    navigate("/minha-conta");
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter products with members area enabled
  const productsWithContent = access.filter(
    (a) => a.product?.members_area_enabled
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Área de Membros</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {buyer?.name || buyer?.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Products with Content */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Meus Conteúdos</h2>
          </div>

          {productsWithContent.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Você ainda não tem acesso a nenhum conteúdo exclusivo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {productsWithContent.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {item.product?.image_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-1">
                      {item.product?.name}
                    </CardTitle>
                    {item.product?.description && (
                      <CardDescription className="line-clamp-2">
                        {item.product.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Link to={`/minha-conta/produto/${item.product_id}`}>
                      <Button className="w-full" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Acessar Conteúdo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Separator />

        {/* Order History */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Histórico de Compras</h2>
          </div>

          {orders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma compra encontrada.
                </p>
              </CardContent>
            </Card>
          ) : (
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
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {order.product_name || order.product?.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="font-semibold">
                          {formatCurrency(order.amount_cents)}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}