import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search,
  Play,
  Lock
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterType = "todos" | "ativos" | "arquivados";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { buyer, isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { access, isLoading: dataLoading, fetchAccess } = useBuyerOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("ativos");

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

  // Filter products with members area enabled based on selected filter
  const productsWithContent = access.filter((a) => {
    if (!a.product?.members_area_enabled) return false;
    
    switch (filter) {
      case "ativos":
        return a.is_active === true;
      case "arquivados":
        return a.is_active === false;
      case "todos":
      default:
        return true;
    }
  });

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
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="arquivados">Arquivados</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Course Grid - Kiwify Style (Large Cards) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group bg-card"
          >
            {/* Course Image - Larger aspect ratio like Kiwify */}
            <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
              {item.product?.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="h-20 w-20 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Course Info - Compact like Cakto */}
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium text-base line-clamp-2">
                {item.product?.name}
              </h3>

              {/* Começar Button - Cakto Style */}
              <Link to={`/minha-conta/produto/${item.product_id}`} className="block">
                <Button className="w-full gap-2 h-10 text-sm" size="default">
                  Começar
                  <Play className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
