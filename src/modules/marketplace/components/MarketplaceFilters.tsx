/**
 * MarketplaceFilters - Filtros do Marketplace
 * 
 * Componente com filtros avançados inspirados em Kirvano:
 * - Produto (Autoral, Afiliação ativa)
 * - Aprovação (Imediata, Mediante moderação)
 * - Tipo (E-book, Serviço, Curso)
 * - Categoria
 * - Comissão
 * - Ordenação
 */

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import type { MarketplaceFilters as Filters } from "@/services/marketplace";

type MarketplaceCategory = Database["public"]["Tables"]["marketplace_categories"]["Row"];

interface MarketplaceFiltersProps {
  categories: MarketplaceCategory[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function MarketplaceFilters({ categories, filters, onFiltersChange }: MarketplaceFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Aplicar busca
  const handleSearch = () => {
    onFiltersChange({ ...filters, search: searchInput });
  };

  // Limpar busca
  const handleClearSearch = () => {
    setSearchInput("");
    onFiltersChange({ ...filters, search: "" });
  };

  // Limpar todos os filtros
  const handleClearAll = () => {
    setSearchInput("");
    onFiltersChange({
      category: undefined,
      search: undefined,
      minCommission: undefined,
      maxCommission: undefined,
      sortBy: "recent",
      approvalImmediate: undefined,
      approvalModeration: undefined,
      typeEbook: undefined,
      typeService: undefined,
      typeCourse: undefined,
    });
  };

  // Toggle filtro de aprovação
  const handleApprovalChange = (type: "immediate" | "moderation", checked: boolean) => {
    if (type === "immediate") {
      onFiltersChange({ ...filters, approvalImmediate: checked || undefined });
    } else {
      onFiltersChange({ ...filters, approvalModeration: checked || undefined });
    }
  };

  // Toggle filtro de tipo
  const handleTypeChange = (type: "ebook" | "service" | "course", checked: boolean) => {
    if (type === "ebook") {
      onFiltersChange({ ...filters, typeEbook: checked || undefined });
    } else if (type === "service") {
      onFiltersChange({ ...filters, typeService: checked || undefined });
    } else {
      onFiltersChange({ ...filters, typeCourse: checked || undefined });
    }
  };

  // Selecionar todos de um grupo
  const handleSelectAllApproval = () => {
    const allSelected = filters.approvalImmediate && filters.approvalModeration;
    onFiltersChange({
      ...filters,
      approvalImmediate: allSelected ? undefined : true,
      approvalModeration: allSelected ? undefined : true,
    });
  };

  const handleSelectAllTypes = () => {
    const allSelected = filters.typeEbook && filters.typeService && filters.typeCourse;
    onFiltersChange({
      ...filters,
      typeEbook: allSelected ? undefined : true,
      typeService: allSelected ? undefined : true,
      typeCourse: allSelected ? undefined : true,
    });
  };

  // Contar filtros ativos
  const activeFiltersCount = [
    filters.category,
    filters.search,
    filters.minCommission,
    filters.maxCommission,
    filters.sortBy !== "recent" ? filters.sortBy : null,
    filters.approvalImmediate,
    filters.approvalModeration,
    filters.typeEbook,
    filters.typeService,
    filters.typeCourse,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Filtrar</h3>
        </div>
        {activeFiltersCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {activeFiltersCount} ativo{activeFiltersCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Busca */}
      <div className="space-y-2">
        <Label htmlFor="search" className="text-xs font-medium">
          Nome do produtor ou do produto
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Insira..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-9 text-sm"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Aprovação (Imediata, Mediante moderação) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Aprovação</Label>
          <button 
            onClick={handleSelectAllApproval}
            className="text-xs text-primary hover:underline"
          >
            (Selecionar todos)
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="imediata" 
              checked={filters.approvalImmediate || false}
              onCheckedChange={(checked) => handleApprovalChange("immediate", checked === true)}
            />
            <label
              htmlFor="imediata"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Imediata
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="moderacao" 
              checked={filters.approvalModeration || false}
              onCheckedChange={(checked) => handleApprovalChange("moderation", checked === true)}
            />
            <label
              htmlFor="moderacao"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mediante moderação
            </label>
          </div>
        </div>
      </div>

      {/* Tipo (E-book, Serviço, Curso) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Tipo</Label>
          <button 
            onClick={handleSelectAllTypes}
            className="text-xs text-primary hover:underline"
          >
            (Selecionar todos)
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="ebook" 
              checked={filters.typeEbook || false}
              onCheckedChange={(checked) => handleTypeChange("ebook", checked === true)}
            />
            <label
              htmlFor="ebook"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              E-book e arquivos
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="servico" 
              checked={filters.typeService || false}
              onCheckedChange={(checked) => handleTypeChange("service", checked === true)}
            />
            <label
              htmlFor="servico"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Serviço
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="curso" 
              checked={filters.typeCourse || false}
              onCheckedChange={(checked) => handleTypeChange("course", checked === true)}
            />
            <label
              htmlFor="curso"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Curso
            </label>
          </div>
        </div>
      </div>

      {/* Categoria */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="category" className="text-xs font-medium">
            Categoria
          </Label>
          <button className="text-xs text-primary hover:underline">
            (Selecionar todos)
          </button>
        </div>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger id="category" className="h-9 text-sm">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comissão Mínima */}
      <div className="space-y-2">
        <Label htmlFor="minCommission" className="text-xs font-medium">
          Comissão Mínima (%)
        </Label>
        <Input
          id="minCommission"
          type="number"
          min="0"
          max="100"
          placeholder="Ex: 20"
          value={filters.minCommission || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              minCommission: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="h-9 text-sm"
        />
      </div>

      {/* Comissão Máxima */}
      <div className="space-y-2">
        <Label htmlFor="maxCommission" className="text-xs font-medium">
          Comissão Máxima (%)
        </Label>
        <Input
          id="maxCommission"
          type="number"
          min="0"
          max="100"
          placeholder="Ex: 50"
          value={filters.maxCommission || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              maxCommission: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="h-9 text-sm"
        />
      </div>

      {/* Ordenação */}
      <div className="space-y-2">
        <Label htmlFor="sortBy" className="text-xs font-medium">
          Ordenar por
        </Label>
        <Select
          value={filters.sortBy || "recent"}
          onValueChange={(value: any) =>
            onFiltersChange({ ...filters, sortBy: value })
          }
        >
          <SelectTrigger id="sortBy" className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem>
            <SelectItem value="popular">Mais Populares</SelectItem>
            <SelectItem value="commission">Maior Comissão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Botões Limpar e Aplicar */}
      <div className="flex gap-2 pt-4 border-t border-border/40">
        <Button
          variant="ghost"
          onClick={handleClearAll}
          className="flex-1 h-9 text-sm"
        >
          Limpar
        </Button>
        <Button
          onClick={handleSearch}
          className="flex-1 h-9 text-sm"
        >
          Aplicar
        </Button>
      </div>
    </div>
  );
}
