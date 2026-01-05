import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Search,
  Play,
  Lock,
  Filter
} from "lucide-react";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { buyer, isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { access, isLoading: dataLoading, fetchAccess } = useBuyerOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/minha-conta");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccess();
    }
  }, [isAuthenticated, fetchAccess]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter products with members area enabled
  const productsWithContent = access.filter(
    (a) => a.product?.members_area_enabled && a.is_active
  );

  // Apply search filter
  const filteredProducts = productsWithContent.filter((item) => {
    if (!searchQuery) return true;
    const name = item.product?.name?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Cursos</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? "curso disponível" : "cursos disponíveis"}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={filterActive ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterActive(!filterActive)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Ativos
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery 
                ? "Nenhum curso corresponde à sua busca. Tente outro termo."
                : "Você ainda não tem acesso a nenhum curso. Quando você adquirir um produto, ele aparecerá aqui."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Course Grid - Kiwify/Cakto Style */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((item) => {
          // TODO: Calculate actual progress from buyer_content_progress
          const progress = 0;

          return (
            <Link 
              key={item.id} 
              to={`/minha-conta/produto/${item.product_id}`}
              className="group"
            >
              <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                {/* Course Image */}
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 overflow-hidden relative">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="sm" variant="secondary" className="gap-2">
                      <Play className="h-4 w-4" />
                      Acessar
                    </Button>
                  </div>
                </div>

                {/* Course Info */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                      {item.product?.name}
                    </h3>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                      {item.is_active ? "Ativo" : "Expirado"}
                    </Badge>
                    {item.expires_at && (
                      <span className="text-xs text-muted-foreground">
                        Expira em {new Date(item.expires_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
