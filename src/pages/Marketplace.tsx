/**
 * Marketplace - Página do Marketplace de Afiliados
 * 
 * Página onde afiliados podem descobrir e solicitar afiliação a produtos
 * Layout inspirado em Kirvano (abas horizontais, sem sidebar)
 */

import { useState } from "react";
import { Store, Search, SlidersHorizontal } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useMarketplaceProducts } from "@/hooks/useMarketplaceProducts";
import { useMarketplaceTracking } from "@/hooks/useMarketplaceTracking";
import { MarketplaceGrid } from "@/modules/marketplace/components/MarketplaceGrid";
import { ProductDetails } from "@/modules/marketplace/components/ProductDetails";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MarketplaceFilters } from "@/modules/marketplace/components/MarketplaceFilters";
import type { Database } from "@/integrations/supabase/types";

type MarketplaceProduct = Database["public"]["Views"]["marketplace_products"]["Row"];

export default function Marketplace() {
  const {
    products,
    categories,
    filters,
    setFilters,
    isLoading,
    hasMore,
    loadMore,
  } = useMarketplaceProducts();

  const { trackView, trackClick } = useMarketplaceTracking();

  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [activeTab, setActiveTab] = useState("todos");

  // Abrir detalhes do produto
  const handleViewDetails = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setDetailsOpen(true);
      trackView(productId);
    }
  };


  // Buscar
  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
  };

  // Mudar aba
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Aplicar filtros baseado na aba
    switch (value) {
      case "em_alta":
        setFilters({ ...filters, sortBy: "popular" });
        break;
      case "mais_lucrativos":
        setFilters({ ...filters, sortBy: "commission" });
        break;
      case "novidades":
        setFilters({ ...filters, sortBy: "recent" });
        break;
      default:
        setFilters({ ...filters, sortBy: "recent" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Marketplace - RiseCheckout</title>
        <meta
          name="description"
          content="Descubra produtos para promover e ganhe comissões"
        />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">
              Descubra produtos para promover e ganhe comissões
            </p>
          </div>
        </div>

        {/* Abas e Busca */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Abas */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="em_alta">Em alta</TabsTrigger>
              <TabsTrigger value="mais_lucrativos">Mais lucrativos</TabsTrigger>
              <TabsTrigger value="novidades">Novidades</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Busca e Filtros */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="O que você está buscando?"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>

            {/* Botão de Filtros (Sheet) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Refine sua busca por categoria, comissão e mais
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <MarketplaceFilters
                    categories={categories}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Contagem de produtos */}
        {!isLoading && products.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {products.length} produto{products.length !== 1 ? "s" : ""} encontrado
            {products.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Grid de Produtos (largura total) */}
        <MarketplaceGrid
          products={products}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onViewDetails={handleViewDetails}
        />

        {/* Modal de Detalhes */}
        <ProductDetails
          product={selectedProduct}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>
    </>
  );
}
