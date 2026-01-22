/**
 * BuyerDashboard - My Courses dashboard page
 * Shows courses the authenticated buyer has access to
 */

import { useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useBuyerAuth } from "@/hooks/useBuyerAuth";
import { useBuyerAccessQuery } from "@/hooks/useBuyerOrders";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Package, Play } from "lucide-react";

type FilterType = "todos" | "ativos" | "arquivados";

export default function BuyerDashboard() {
  const { buyer, isLoading: authLoading, isAuthenticated } = useBuyerAuth();
  const { data: access, isLoading: accessLoading } = useBuyerAccessQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("todos");

  // ✅ useMemo ANTES de qualquer early return (Regra dos Hooks)
  const filteredProducts = useMemo(() => {
    if (!access) return [];

    return access.filter((item) => {
      // Only show products with members area enabled
      if (!item.product?.members_area_enabled) return false;

      // Filter by status
      if (filter === "ativos" && !item.is_active) return false;
      if (filter === "arquivados" && item.is_active) return false;

      // Filter by search query
      if (searchQuery) {
        const name = item.product?.name?.toLowerCase() || "";
        return name.includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [access, filter, searchQuery]);

  // ✅ Early returns DEPOIS de todos os hooks
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/minha-conta" replace />;
  }

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus Cursos</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} curso{filteredProducts.length !== 1 ? "s" : ""} disponível{filteredProducts.length !== 1 ? "is" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar curso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "Nenhum curso encontrado" : "Você ainda não tem cursos"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Tente ajustar sua busca."
                : "Quando você comprar um curso, ele aparecerá aqui."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((item) => (
          <Link
            key={item.id}
            to={`/minha-conta/produto/${item.product_id}`}
            className="group"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              {/* Course Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {item.product?.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Package className="h-12 w-12 text-primary/50" />
                  </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                    <Play className="h-6 w-6 text-primary-foreground ml-1" />
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {item.product?.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique para acessar
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
